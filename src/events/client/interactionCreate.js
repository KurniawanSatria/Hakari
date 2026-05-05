// src/events/client/interactionCreate.js - Button interactions

const logger = require('../../structures/logger');
const { rejectMessage, hakariCard, hakariMessage } = require('../../structures/builders');
const { EMOJIS } = require('../../structures/emojis');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    execute: async (client, interaction) => {
        try {
            // Only handle buttons
            if (!interaction.isButton()) return;

            // Validate interaction properties
            if (!interaction.guildId || !interaction.customId) {
                logger.debug('interactionCreate: Missing required interaction properties');
                return;
            }

            const { customId } = interaction;

            // Handle help buttons (no player required)
            if (customId === 'help_playback' || customId === 'help_filters' || customId === 'help_utility' || customId === 'help_owner') {
                try {
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => { });
                    }

                    const response = {
                        components: [new ContainerBuilder()],
                        flags: MessageFlags.IsComponentsV2
                    };

                    if (customId === 'help_playback') {
                        response.components[0]
                            .setAccentColor(0x5865F2)
                            .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.playback} Playback Commands\n\n• \`.play <query or URL>\` - Play music\n• \`.pause\` - Pause music\n• \`.resume\` - Resume music\n• \`.stop\` - Stop and clear queue\n• \`.skip\` - Skip current song\n• \`.queue\` - View queue\n• \`.loop <off/track/queue>\` - Set loop mode\n• \`.shuffle\` - Shuffle queue\n• \`.autoplay <on/off>\` - Toggle autoplay\n\n-# Most commands require you to be in a voice channel`));
                    } else if (customId === 'help_filters') {
                        response.components[0]
                            .setAccentColor(0x57F287)
                            .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.filters} Audio Filters\n\n• \`.bassboost\` - Toggle bass boost\n• \`.nightcore\` - Faster & higher pitch\n• \`.vaporwave\` - Slower & lower pitch\n• \`.karaoke\` - Vocal removal\n• \`.tremolo\` - Volume oscillation\n• \`.vibrato\` - Pitch oscillation\n• \`.rotation\` - 8D audio effect\n• \`.distortion\` - Distortion filter\n• \`.lowpass\` - Muffle high frequencies\n\n-# Toggle filters on/off with the same command`));
                    } else if (customId === 'help_utility') {
                        response.components[0]
                            .setAccentColor(0xFEE75C)
                            .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.utility} Utility Commands\n\n• \`.lyrics\` - Display current song lyrics\n• \`.help [command]\` - Get command details\n\n-# Lyrics requires the song to have lyrics available`));
                    } else if (customId === 'help_owner') {
                        response.components[0]
                            .setAccentColor(0xED4245)
                            .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.help_sections.owner} Owner Commands\n\n• \`.eval <code>\` - Execute JavaScript code\n• \`.emit <event-name>\` - Emit events for testing\n\n-# These commands are restricted to the bot owner only`));
                    }

                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(response).catch(() => { });
                    } else {
                        await interaction.reply(response).catch(() => { });
                    }
                    return;
                } catch (err) {
                    logger.error(`Help button error: ${err.message}`);
                    return;
                }
            }

            // Handle guild welcome buttons (no player required)
            if (customId === 'setup_now' || customId === 'show_commands') {
                try {
                    await interaction.deferReply({ ephemeral: true }).catch(() => { });

                    if (customId === 'setup_now') {
                        await interaction.editReply({
                            components: [new ContainerBuilder()
                                .setAccentColor(0x5865F2)
                                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.welcome.setup} Quick Setup\n\nDefault settings applied:\n• Prefix: \`.\`\n• Language: English\n• Autoplay: Enabled\n• 24/7 Mode: Disabled\n\n### ${EMOJIS.welcome.playing} Start Playing\nUse \`.play <song name or URL>\` to start!\n\n-# You can change settings anytime with \`.lang\` and other commands.`))
                            ],
                            flags: MessageFlags.IsComponentsV2
                        });
                    } else if (customId === 'show_commands') {
                        const commandList = Array.from(client.commands.values())
                            .map(cmd => {
                                const aliases = cmd.aliases && cmd.aliases.length > 0
                                    ? ` *(${cmd.aliases.join(', ')})*`
                                    : '';
                                return `- \`.${cmd.name}${aliases}\``;
                            })
                            .join('\n');

                        await interaction.editReply({
                            components: [new ContainerBuilder()
                                .setAccentColor(0x57F287)
                                .addTextDisplayComponents(td => td.setContent(`## ${EMOJIS.welcome.commands} Available Commands\n\n${commandList}\n\n-# Use \`.help <command>\` for detailed info`))
                            ],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }
                    return;
                } catch (err) {
                    logger.error(`Guild welcome button error: ${err.message}`);
                    return;
                }
            }

            // Check if manager is initialized (for music buttons)
            if (!client.manager) {
                return interaction.reply({
                    ...rejectMessage('Music not initialized.'),
                    ephemeral: true
                }).catch(() => { });
            }

            // Safely get player (for music buttons)
            const player = client.manager.players.get(interaction.guildId);
            if (!player || player.destroyed) {
                return interaction.reply({
                    ...rejectMessage('No active player.'),
                    ephemeral: true
                }).catch(() => { });
            }

            // Safe reply helper
            async function safeReply(content, ephemeral = false) {
                try {
                    return await interaction.reply(hakariMessage(content));
                } catch (err) {
                    logger.debug(`interactionCreate safeReply: ${err.message}`);
                    return null;
                }
            }

            async function reject(reason) {
                const msg = await safeReply(rejectMessage(reason), false);
                if (msg) {
                    setTimeout(() => msg.delete().catch(() => { }), 60000);
                }
            }

            // Helper: Check if requester is still in voice channel
            function isRequesterInVoice() {
                try {
                    const requester = player.current?.requester;
                    if (!requester) return false;

                    const voiceChannel = interaction.guild?.channels?.cache.get(player.voiceChannelId);
                    if (!voiceChannel) return false;

                    return voiceChannel.members.has(requester.id);
                } catch (err) {
                    logger.debug(`isRequesterInVoice: ${err.message}`);
                    return false;
                }
            }

            // Helper: Handle voting system for playback controls
            async function handleVoting(action) {
                try {
                    const userVoice = interaction.member?.voice?.channel;
                    if (!userVoice || userVoice.id !== player.voiceChannelId) {
                        await reject("You must be in the voice channel to use this.");
                        return false;
                    }

                    // Check if requester is in voice
                    const requesterInVoice = isRequesterInVoice();
                    const isRequester = player.current?.requester && interaction.user.id === player.current.requester.id;

                    // If requester is in voice and this is not the requester, trigger voting
                    if (requesterInVoice && !isRequester) {
                        const voteKey = `${action}Votes`;

                        // Ensure vote set exists and is a Set
                        if (!(player[voteKey] instanceof Set)) {
                            player[voteKey] = new Set();
                        }

                        if (player[voteKey].has(interaction.user.id)) {
                            const voiceChannel = interaction.guild?.channels?.cache.get(player.voiceChannelId);
                            const totalUsers = voiceChannel ? voiceChannel.members.filter(m => !m.user.bot).size : 2;
                            const required = Math.ceil(totalUsers / 2);
                            await interaction.reply(hakariMessage(`You already voted! (${player[voteKey].size}/${required} votes needed)`));
                            return false;
                        }

                        player[voteKey].add(interaction.user.id);

                        const voiceChannel = interaction.guild?.channels?.cache.get(player.voiceChannelId);
                        if (!voiceChannel) {
                            await reject("Voice channel not found.");
                            return false;
                        }

                        const totalUsers = voiceChannel.members.filter(m => !m.user.bot).size;
                        const required = Math.ceil(totalUsers / 2);

                        if (player[voteKey].size < required) {
                            await interaction.reply(hakariMessage(`Vote added! (${player[voteKey].size}/${required} votes needed)`));
                            return false;
                        }

                        // Voting passed
                        player[voteKey] = new Set();
                        return true;
                    }

                    // Requester or requester not in voice - allow immediately
                    return true;
                } catch (err) {
                    logger.error(`handleVoting error: ${err.message}`);
                    await reject("Error processing vote.");
                    return false;
                }
            }

            // Initialize vote sets if they don't exist
            if (!player.skipVotes) player.skipVotes = new Set();
            if (!player.stopVotes) player.stopVotes = new Set();
            if (!player.previousVotes) player.previousVotes = new Set();
            if (!player.pauseVotes) player.pauseVotes = new Set();

            // Reset votes when track changes (called from trackStart event)
            player.resetVotes = function () {
                player.skipVotes = new Set();
                player.stopVotes = new Set();
                player.previousVotes = new Set();
                player.pauseVotes = new Set();
            };

            // Check if this is a queue pagination button
            const queuePageMatch = customId.match(/^queue_(next|prev)_(\d+)$/);
            const queueInfoMatch = customId.match(/^queue_page_(\d+)$/);

            // Helper function to create queue message with pagination buttons
            function createQueueMessage(page, tracks, totalTracks) {
                try {
                    const tracksPerPage = 10;
                    const start = page * tracksPerPage;
                    const end = Math.min(start + tracksPerPage, totalTracks);
                    const totalPages = Math.ceil(totalTracks / tracksPerPage);

                    const queueList = tracks.slice(start, end).map((t, i) => {
                        const globalIndex = start + i + 1;
                        const title = t.title || 'Unknown';
                        const uri = t.uri || '#';
                        const author = t.author || 'Unknown';
                        return `\`${globalIndex}.\` **[${title}](${uri})** - ${author}`;
                    }).join('\n');

                    const header = `### ${EMOJIS.music.queue} Music Queue`;
                    const body = `${queueList}\n\n-# Total: ${totalTracks} tracks`

                    // Create navigation buttons
                    const buttons = new ActionRowBuilder();

                    buttons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_prev_${page}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(EMOJIS.navigation.left)
                            .setDisabled(page === 0)
                    );

                    buttons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_page_${page}`)
                            .setLabel(`${page + 1}/${totalPages}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );

                    buttons.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`queue_next_${page}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji(EMOJIS.navigation.right)
                            .setDisabled(page >= totalPages - 1)
                    );

                    const thumbnailURL = player.current?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg';

                    // Build container
                    const container = new ContainerBuilder()
                        .setAccentColor(0xE7B88B)
                        .addSectionComponents(section =>
                            section
                                .addTextDisplayComponents(td => td.setContent(header))
                                .setThumbnailAccessory(thumb => thumb.setURL(thumbnailURL).setDescription('Queue thumbnail'))
                        )
                        .addSeparatorComponents(sep => sep.setDivider(true))
                        .addTextDisplayComponents(td => td.setContent(body));

                    container.addActionRowComponents(buttons);

                    return {
                        components: [container],
                        flags: MessageFlags.IsComponentsV2
                    };
                } catch (err) {
                    logger.error(`createQueueMessage error: ${err.message}`);
                    return {
                        content: rejectMessage("Failed to display queue."),
                        flags: MessageFlags.IsComponentsV2
                    };
                }
            }

            // Handle button actions
            switch (customId) {
                case 'stop': {
                    const voteResult = await handleVoting('stop');
                    if (voteResult !== true) return;

                    // Clean up lyrics
                    if (player.lyricsMsg) {
                        player.lyricsMsg.delete().catch(() => { });
                        player.lyricsMsg = null;
                    }
                    player.lyricsData = null;
                    player.lyricsLines = null;
                    player.HandleByLyrics = false;

                    // Clean up track message
                    // Clean up track message
                    const playerMsg = global.db.data.guilds[player.guildId].message;
                    if (playerMsg?.id && playerMsg?.channelId) {
                        const oldChannel = client.channels?.cache.get(playerMsg.channelId);
                        if (oldChannel) {
                            const oldMsg = await oldChannel.messages.fetch(playerMsg.id).catch(() => null);
                            if (oldMsg && oldMsg.deletable) {
                                await oldMsg.delete().catch(() => null);
                                global.db.data.guilds[player.guildId].message = null;
                                await global.db.write();
                            }
                        }
                    }

                    await player.stop();
                    await player.queue.clear();

                    await safeReply(rejectMessage(`Stopped by <@${interaction.user.id}>.`));
                }
                    break;

                case 'skip': {
                    const voteResult = await handleVoting('skip');
                    if (voteResult !== true) return;

                    try {
                        const title = player.current?.title || 'track';
                        player.skip();
                        await safeReply(rejectMessage(`Skipped ${title} by <@${interaction.user.id}>.`));
                    } catch (err) {
                        logger.error(`skip error: ${err.message}`);
                        await reject("Failed to skip track.");
                    }
                }
                    break;

                case 'pause_resume': {
                    const voteResult = await handleVoting('pause');
                    if (voteResult !== true) return;

                    try {
                        if (player.paused) {
                            player.resume();
                            const title = player.current?.title || 'track';
                            await safeReply(rejectMessage(`Resumed ${title} by <@${interaction.user.id}>.`));
                        } else {
                            player.pause();
                            await safeReply(rejectMessage(`<@${interaction.user.id}> ⏸ Paused.`));
                        }
                    } catch (err) {
                        logger.error(`pause_resume error: ${err.message}`);
                        await reject("Failed to pause/resume.");
                    }
                }
                    break;

                case 'previous': {
                    const voteResult = await handleVoting('previous');
                    if (voteResult !== true) return;

                    try {
                        const wentBack = await player.back();
                        if (wentBack) {
                            await safeReply(rejectMessage(`<@${interaction.user.id}> went back.`));
                        } else {
                            await reject('No previous track.');
                        }
                    } catch (err) {
                        logger.error(`previous error: ${err.message}`);
                        await reject("Failed to go to previous track.");
                    }
                }
                    break;

                case 'queue': {
                    // Defer interaction first
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferReply({ ephemeral: true }).catch(() => { });
                    }

                    const userVoice = interaction.member?.voice?.channel;
                    if (!userVoice || userVoice.id !== player.voiceChannelId) {
                        await reject("You must be in the voice channel to use this.");
                        return;
                    }

                    const queue = player.queue;
                    const tracks = queue?.tracks || [];

                    if (tracks.length === 0) {
                        await reject("Queue is empty.");
                        return;
                    }

                    // Send first page of queue
                    try {
                        await interaction.reply(createQueueMessage(0, tracks, tracks.length));
                    } catch (e) {
                        logger.error(`Queue message failed: ${e.message}`);
                        await safeReply(rejectMessage("Failed to display queue."), true);
                    }
                }
                    break;

                // Queue pagination buttons
                default: {
                    // Handle queue info button (disabled, just ignore)
                    if (queueInfoMatch) {
                        try {
                            await interaction.deferUpdate();
                        } catch (e) {
                            // Ignore errors from disabled button clicks
                        }
                        return;
                    }

                    // Handle queue pagination
                    if (queuePageMatch) {
                        const userVoice = interaction.member?.voice?.channel;
                        if (!userVoice || userVoice.id !== player.voiceChannelId) {
                            await safeReply(rejectMessage("You must be in the voice channel to use this."), true);
                            return;
                        }

                        const action = queuePageMatch[1];
                        const currentPage = parseInt(queuePageMatch[2]);
                        const tracks = player.queue?.tracks || [];

                        // Check if queue is empty/expired
                        if (tracks.length === 0) {
                            try {
                                await interaction.update({
                                    ...rejectMessage("Queue is now empty."),
                                    components: []
                                });
                            } catch (e) {
                                logger.error(`Queue update failed: ${e.message}`);
                            }
                            return;
                        }

                        let newPage = currentPage;
                        if (action === 'next') {
                            newPage = currentPage + 1;
                        } else if (action === 'prev') {
                            newPage = Math.max(0, currentPage - 1);
                        }

                        // Validate page number
                        const totalPages = Math.ceil(tracks.length / 10);
                        newPage = Math.min(Math.max(0, newPage), totalPages - 1);

                        // Update the message with new page
                        try {
                            await interaction.update(createQueueMessage(newPage, tracks, tracks.length));
                        } catch (e) {
                            logger.error(`Queue pagination update failed: ${e.message}`);
                            await safeReply(rejectMessage("Failed to update queue view."), true);
                        }
                        break;
                    }

                    logger.warn(`Unknown button: ${customId}`);
                }
            }

        } catch (err) {
            logger.error(`interactionCreate handler error: ${err.message}`, { stack: err.stack });
            if (!interaction.replied && !interaction.deferred) {
                interaction.reply({
                    ...rejectMessage('Error processing interaction.'),
                    ephemeral: true
                }).catch(() => { });
            }
        }
    }
};
