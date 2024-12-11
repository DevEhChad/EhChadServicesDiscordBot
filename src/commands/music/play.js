const {
    ApplicationCommandOptionType,
    Client,
    Interaction,
    PermissionFlagsBits
  } = require('discord.js');
  const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    StreamType
  } = require('@discordjs/voice');
  const ytdl = require('ytdl-core');
  
  module.exports = {
    callback: async (client, interaction) => {
      try {
        await interaction.deferReply();
  
        const voiceChannel = interaction.member.voice.channel;
        const songUrl = interaction.options.getString('song-url');
  
        if (!voiceChannel) {
          return interaction.editReply('You must be in a voice channel to use this command.');
        }
  
        if (!songUrl) {
          return interaction.editReply('Please provide a song URL.');
        }
  
        // Join the voice channel
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
  
        const player = createAudioPlayer();
        connection.subscribe(player);
  
        try {
          // Play the provided song URL
          const stream = ytdl(songUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
          });
  
          const resource = createAudioResource(stream, {
            inputType: StreamType.Arbitrary,
          });
  
          player.play(resource);
  
          player.on('error', error => {
            console.error(`Error playing song ${songUrl}:`, error);
            interaction.followUp(`Error playing song: ${songUrl}`);
          });
  
          await interaction.followUp(`Now playing: ${songUrl}`);
        } catch (error) {
          console.error(`Error playing song ${songUrl}:`, error);
          interaction.followUp(`Error playing song: ${songUrl}`);
        }
      } catch (error) {
        console.error('Error playing song:', error);
        await interaction.editReply('An error occurred while trying to play the song.');
      }
    },
    deleted: true,
    devOnly: true,
    name: 'play', // Choose a name for your command
    description: 'Plays a song from the provided URL.',
    options: [{
      name: 'song-url',
      type: ApplicationCommandOptionType.String,
      required: true,
      description: 'The URL of the song to play'
    }],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
  };