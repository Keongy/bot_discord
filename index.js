import { Client, GatewayIntentBits, Events } from 'discord.js';
import { Player } from 'discord-player';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// IDs des utilisateurs à surveiller
const USER1 = process.env.TARGET_ID_1;
const USER2 = process.env.TARGET_ID_2;
const PERMANENT_VOICE_CHANNEL = process.env.PERMANENT_VOICE_CHANNEL;

let permanentConnection = null;

// Sons d'arrivée
const JOIN_SOUND_USER1 = 'fdp.mp3';
const JOIN_SOUND_USER2 = 'alerte-au-gogole.mp3';

// Initialise le client et le player
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const dp = new Player(client);

client.once(Events.ClientReady, async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    try {
        const channel = await client.channels.fetch(PERMANENT_VOICE_CHANNEL);
        if (channel && channel.isVoiceBased()) {
            permanentConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true
            });
            console.log(`🔊 Connecté en permanence au salon : ${channel.name}`);
        } else {
            console.error("❌ Le salon vocal permanent est invalide.");
        }
    } catch (err) {
        console.error("❌ Erreur lors de la connexion au salon vocal permanent :", err);
    }
});

// ─── Fonction de lecture de son ─────────────────────────────────────────────

function playEffect(channel, file) {
    const usePermanent = channel.id === PERMANENT_VOICE_CHANNEL && permanentConnection;

    const conn = usePermanent
        ? permanentConnection
        : joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });

    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });
    const res = createAudioResource(path.resolve(`./sounds/${file}`));
    conn.subscribe(player);

    setTimeout(() => player.play(res), 1000);

    player.once(AudioPlayerStatus.Idle, () => {
        if (!usePermanent && conn.state.status !== VoiceConnectionStatus.Destroyed) {
            conn.destroy();
        }
    });
}

// ─── Événements Vocales ─────────────────────────────────────────────────────

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const id = newState.member.id;
    const chanOld = oldState.channel?.id;
    const chanNew = newState.channel?.id;

    if (!chanOld && chanNew && id === USER1) {
        return playEffect(newState.channel, JOIN_SOUND_USER1);
    }

    if (!chanOld && chanNew && id === USER2) {
        return playEffect(newState.channel, JOIN_SOUND_USER2);
    }

    if (
        id === USER1 &&
        !oldState.selfMute &&
        newState.selfMute &&
        chanNew &&
        !newState.selfDeaf
    ) {
        return playEffect(newState.channel, 'fart.mp3');
    }

    if (
        id === USER1 &&
        !oldState.selfDeaf &&
        newState.selfDeaf &&
        chanNew
    ) {
        return playEffect(newState.channel, 'mute.mp3');
    }

    if (
        id === USER2 &&
        !oldState.selfMute &&
        newState.selfMute &&
        chanNew &&
        !newState.selfDeaf
    ) {
        return playEffect(newState.channel, 'dbz.mp3');
    }
});

client.login(process.env.YOUR_TOKEN);
