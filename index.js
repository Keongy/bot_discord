import { Client, GatewayIntentBits, Events } from 'discord.js';
import { Player } from 'discord-player';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    VoiceConnectionStatus
} from '@discordjs/voice';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// IDs des utilisateurs à surveiller
const USER1 = process.env.TARGET_ID_1;

// Son d'arrivée pour USER1
const JOIN_SOUND_USER1 = 'fdp.mp3';

// Initialise le client et le player Discord-Player
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const dp = new Player(client);

client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ─── Fonctions de son pour utilisateurs spécifiques ────────────────────────

function playEffect(channel, file) {
    const conn = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });
    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });
    const res = createAudioResource(path.resolve(`./sounds/${file}`));
    conn.subscribe(player);

    // délai pour s'assurer que la connexion est prête
    setTimeout(() => player.play(res), 1000);

    player.once(AudioPlayerStatus.Idle, () => {
        if (conn.state.status !== VoiceConnectionStatus.Destroyed) {
            conn.destroy();
        }
    });
}

// ─── Événements Vocales ─────────────────────────────────────────────────────

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const id = newState.member.id;
    const chanOld = oldState.channel?.id;
    const chanNew = newState.channel?.id;

    // 1) Arrivée dans un vocal pour USER1
    if (!chanOld && chanNew && id === USER1) {
        return playEffect(newState.channel, JOIN_SOUND_USER1);
    }

    // 2) Micro désactivé → jouer fart.mp3 (seulement si pas en sourdine)
    if (
        id === USER1 &&
        !oldState.selfMute &&
        newState.selfMute &&
        chanNew &&
        !newState.selfDeaf
    ) {
        return playEffect(newState.channel, 'fart.mp3');
    }

    // 3) Auto-sourdine activée → jouer mute.mp3
    if (
        id === USER1 &&
        !oldState.selfDeaf &&
        newState.selfDeaf &&
        chanNew
    ) {
        return playEffect(newState.channel, 'mute.mp3');
    }
});



// ─── Commandes Messages ────────────────────────────────────────────────────


client.login(process.env.YOUR_TOKEN);
