// index.js
import dotenv from 'dotenv';
dotenv.config();
import { Client, CommandInteraction, Partials } from 'discord.js';
import { AudioPlayer, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, entersState, getVoiceConnection } from '@discordjs/voice';
import { joinVCOfInteraction } from './utils';
import { textToSpeech } from './tts';

type TTSSession = {
	voiceConnection: VoiceConnection,
	player: AudioPlayer,
}

const sessions: Map<string, TTSSession> = new Map();

async function join(
	interaction: CommandInteraction,
	client: Client,
) {
	await interaction.deferReply();
	if (getVoiceConnection(interaction.guildId!)) {
		await interaction.reply({ content: 'Already in a voice channel. ' });
		return;
	}
	const connection = await joinVCOfInteraction(interaction);

	if (connection === null) {
		await interaction.followUp('You need to be in a voice channel to use this command.');
		return;
	}

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

		if (interaction.guildId !== null) {
			const player = createAudioPlayer();
			connection.subscribe(player);
			sessions.set(interaction.user.id, {
				voiceConnection: connection,
				player,
			});
			connection
				.on(VoiceConnectionStatus.Disconnected, async () => {
					// Attempt to reconnect upon disconnection
					try {
						await Promise.race([
							entersState(connection, VoiceConnectionStatus.Signalling, 5000),
							entersState(connection, VoiceConnectionStatus.Connecting, 5000),
						]);
					} catch (err) {
						connection.destroy();
					}
				})
				.on(VoiceConnectionStatus.Destroyed, () => {
					// Free resources upon connection destroyed
					sessions.delete(interaction.user.id);
				});
		}

	} catch (error) {
		console.warn(error);
		await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
	}

	await interaction.followUp('Ready!\nMessages to the DM will be played as speech.');
}

async function leave(
	interaction: CommandInteraction,
	_client: Client,
) {
	const connection = getVoiceConnection(interaction.guildId!) ?? sessions.get(interaction.user.id)?.voiceConnection;
	if (connection) {
		connection.destroy();
		await interaction.reply({ content: 'TTS Ended. ' });
	} else {
		await interaction.reply({ content: 'Not playing in this server!' });
	}
}

const client = new Client({ intents: ['GuildMembers', 'GuildVoiceStates', 'Guilds', 'DirectMessages', 'MessageContent'], partials: [Partials.Channel] });

client.once('ready', () => {
	console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async interaction => {

	if (!interaction.isChatInputCommand()) return;
	// Ignore bot interactions
	if (interaction.user.bot) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('pong!');
	} else if (commandName === 'start') {
		await join(interaction, client);
	} else if (commandName === 'stop') {
		await leave(interaction, client);
	} else {
		await interaction.reply('Unknown command. This should not happen. ');
	}
});

client.on('messageCreate', async msg => {
	if (msg.guildId !== null) {
		return;
	}
	const session = sessions.get(msg.author.id);
	if (!session) {
		return;
	}
	console.log(msg.author.displayName, ':', msg.content);
	const { player } = session;
	const audioStream = await textToSpeech(msg.content);
	if (!audioStream) {
		msg.channel.send('TTS Failed. ');
		return;
	}
	player.play(audioStream);
});

client.login(process.env.DISCORD_BOT_TOKEN);
