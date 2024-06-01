import { SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong! '),
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Join and start TTS broadcast in a voice channel. '),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('End the TTS session and leave the voice channel. '),
];

export default commands;