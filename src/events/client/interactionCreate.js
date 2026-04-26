// src/events/client/interactionCreate.js - Button interactions

const logger = require('../../structures/logger');
const { rejectMessage, hakariCard } = require('../../structures/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    execute: async (client, interaction) => {
        try {
            // Only handle buttons
            if (!interaction.isButton()) return;

            if (!client.manager) {
                return interaction.reply({
                    ...rejectMessage('Music not initialized.'),
                    ephemeral: true
                });
            }

            const player = client.manager.players.get(interaction.guildId);
            if (!player) {
                return interaction.reply({
                    ...rejectMessage('No active player.'),
                    ephemeral: true
                });
            }

            const { customId } = interaction;

            async function reject(reason) {
                const msg = await interaction.reply(rejectMessage(reason));
                setTimeout(() => msg.delete().catch(() => { }), 60000);
            }

            // Helper: Check if requester is still in voice channel
            function isRequesterInVoice() {
                const requester = player.current?.requester;
                if (!requester) return false;

                const voiceChannel = interaction.guild.channels.cache.get(player.voiceChannelId);
                if (!voiceChannel) return false;

                return voiceChannel.members.has(requester.id);
            }

            // Helper: Handle voting system for playback controls
            async function handleVoting(action) {
                const userVoice = interaction.member.voice.channel;
                if (!userVoice || userVoice.id !== player.voiceChannelId) {
                    return reject("You must be in the voice channel to use this.");
                }

                // Check if requester is in voice
                const requesterInVoice = isRequesterInVoice();
                const isRequester = player.current?.requester && interaction.user.id === player.current.requester.id;

                // If requester is in voice and this is not the requester, trigger voting
                if (requesterInVoice && !isRequester) {
                    const voteKey = `${action}Votes`;
                    player[voteKey] = player[voteKey] || new Set();

                    if (player[voteKey].has(interaction.user.id)) {
                        return reject(`You have already voted to ${action}.`);
                    }

                    player[voteKey].add(interaction.user.id);

                    const voiceChannel = interaction.guild.channels.cache.get(player.voiceChannelId);
                    const totalUsers = voiceChannel.members.filter(m => !m.user.bot).size;
                    const required = Math.ceil(totalUsers / 2);

                    if (player[voteKey].size < required) {
                        return reject(`Vote to ${action} added! (${player[voteKey].size}/${required} votes needed)`);
                    }

                    // Voting passed
                    player[voteKey] = new Set();
                    return true;
                }

                // Requester or requester not in voice - allow immediately
                return true;
            }

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
                const tracksPerPage = 10;
                const start = page * tracksPerPage;
                const end = Math.min(start + tracksPerPage, totalTracks);
                const totalPages = Math.ceil(totalTracks / tracksPerPage);

                const queueList = tracks.slice(start, end).map((t, i) => {
                    const globalIndex = start + i + 1;
                    return `\`${globalIndex}.\` **[${t.title}](${t.uri})** - ${t.author}*`;
                }).join('\n');

                const header = `### <:queue:1451682061697159310> Music Queue`;
                const body = `${queueList}\n\n-# Total: ${totalTracks} tracks`
                // Create navigation buttons - always show both but disabled
                const buttons = new ActionRowBuilder();

                // Previous button - always show
                buttons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`queue_prev_${page}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:left:1498024952849498385>')
                        .setDisabled(page === 0)  // Disable if on first page
                );

                // Page info button (always disabled)
                buttons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`queue_page_${page}`)
                        .setLabel(`${page + 1}/${totalPages}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)  // Always disabled (info only)
                );

                // Next button - always show
                buttons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`queue_next_${page}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:right:1465814301787820178>')
                        .setDisabled(page === totalPages - 1)  // Disable if on last page
                );

                // Build container with content and buttons inside
                const container = new ContainerBuilder()
                    .setAccentColor(0xE7B88B)
                    .addSectionComponents(section =>
                        section
                            .addTextDisplayComponents(td => td.setContent(header))
                            .setThumbnailAccessory(thumb => thumb.setURL(player.current?.thumbnail || 'https://files.catbox.moe/fnlch5.jpg').setDescription('Queue thumbnail'))
                    )
                    .addSeparatorComponents(sep => sep.setDivider(true))
                    .addTextDisplayComponents(td => td.setContent(body)
                    );

                // Add buttons to container
                container.addActionRowComponents(buttons);

                return {
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                };
            }

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
                    if (player.msg?.delete) {
                        player.msg.delete().catch(() => { });
                    }
                    player.msg = null;
                    player.queue.clear();
                    await player.destroy();
                    let msg = await interaction.reply(rejectMessage(`Stopped by <@${interaction.user.id}>.`));
                    setTimeout(() => {
                        msg.delete().catch(() => { })
                    }, 60000)
                }
                    break;

                case 'skip': {
                    const voteResult = await handleVoting('skip');
                    if (voteResult !== true) return;

                    const title = player.current?.title || 'track';
                    player.skip();
                    let msg = await interaction.reply(rejectMessage(`Skipped ${title} by <@${interaction.user.id}>.`));
                    setTimeout(() => {
                        msg.delete().catch(() => { })
                    }, 60000)
                }
                    break;

                case 'pause_resume': {
                    const voteResult = await handleVoting('pause');
                    if (voteResult !== true) return;

                    let msg;
                    if (player.paused) {
                        player.resume();
                        const title = player.current?.title || 'track';
                        msg = await interaction.reply(rejectMessage(`Resumed ${title} by <@${interaction.user.id}>.`));
                    } else {
                        player.pause();
                        msg = await interaction.reply(rejectMessage(`<@${interaction.user.id}> ⏸ Paused.`));
                        setTimeout(() => {
                            msg.delete().catch(() => { })
                        }, 60000)
                    }
                }
                    break;

                case 'previous': {
                    const voteResult = await handleVoting('previous');
                    if (voteResult !== true) return;

                    let msg;
                    const wentBack = await player.back();
                    if (wentBack) {
                        msg = await interaction.reply(rejectMessage(`<@${interaction.user.id}> went back.`));
                    } else {
                        msg = await interaction.reply(rejectMessage('No previous track.'));
                    }
                    setTimeout(() => {
                        msg.delete().catch(() => { })
                    }, 60000)
                }
                    break;

                case 'queue': {
                    const userVoice = interaction.member.voice.channel;
                    if (!userVoice || userVoice.id !== player.voiceChannelId) {
                        return reject("You must be in the voice channel to use this.");
                    }

                    const queue = player.queue;
                    const tracks = queue.tracks || [];

                    if (tracks.length === 0) {
                        return reject("Queue is empty.");
                    }

                    // Send first page of queue
                    try {
                        await interaction.reply(createQueueMessage(0, tracks, tracks.length));
                    } catch (e) {
                        logger.error(`Queue message failed: ${e.message}`);
                        await interaction.reply({
                            ...rejectMessage("Failed to display queue."),
                            ephemeral: true
                        }).catch(() => { });
                    }
                }
                    break;

                // Queue pagination buttons
                default: {
                    // Handle queue info button (disabled, just ignore)
                    if (queueInfoMatch) {
                        // This button is disabled and for info only, ignore clicks
                        try {
                            await interaction.deferUpdate();
                        } catch (e) {
                            // Ignore errors from disabled button clicks
                        }
                        return;
                    }

                    // Handle queue pagination
                    if (queuePageMatch) {
                        const userVoice = interaction.member.voice.channel;
                        if (!userVoice || userVoice.id !== player.voiceChannelId) {
                            return interaction.reply({
                                ...rejectMessage("You must be in the voice channel to use this."),
                                ephemeral: true
                            }).catch(() => { });
                        }

                        const action = queuePageMatch[1];
                        const currentPage = parseInt(queuePageMatch[2]);
                        const tracks = player.queue.tracks || [];

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
                            newPage = currentPage - 1;
                        }

                        // Validate page number (recalculate in case queue changed)
                        const totalPages = Math.ceil(tracks.length / 10);

                        // If page is out of bounds, go to last page or show error
                        if (newPage < 0) {
                            newPage = 0;
                        } else if (newPage >= totalPages) {
                            newPage = totalPages - 1;
                        }

                        // Update the message with new page
                        try {
                            await interaction.update(createQueueMessage(newPage, tracks, tracks.length));
                        } catch (e) {
                            logger.error(`Queue pagination update failed: ${e.message}`);
                            // If update fails, send ephemeral error
                            await interaction.reply({
                                ...rejectMessage("Failed to update queue view."),
                                ephemeral: true
                            }).catch(() => { });
                        }
                        break;
                    }

                    logger.warn(`Unknown button: ${customId}`);
                }
            }

        } catch (err) {
            logger.error(`in interactionCreate: ${err.message}`);
            if (!interaction.replied) {
                interaction.reply({
                    ...rejectMessage('Error processing interaction.'),
                    ephemeral: true
                }).catch(() => { });
            }
        }
    }
};
