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
const USER2 = process.env.TARGET_ID_2;

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

client.once(Events.ClientReady, () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ─── Fonction de lecture de son ─────────────────────────────────────────────

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

    // 1b) Arrivée pour USER2
    if (!chanOld && chanNew && id === USER2) {
        return playEffect(newState.channel, JOIN_SOUND_USER2);
    }

    // 2) Micro désactivé pour USER1 → fart.mp3 (seulement si pas en sourdine)
    if (
        id === USER1 &&
        !oldState.selfMute &&
        newState.selfMute &&
        chanNew &&
        !newState.selfDeaf
    ) {
        return playEffect(newState.channel, 'fart.mp3');
    }

    // 3) Auto-sourdine activée pour USER1 → mute.mp3
    if (
        id === USER1 &&
        !oldState.selfDeaf &&
        newState.selfDeaf &&
        chanNew
    ) {
        return playEffect(newState.channel, 'mute.mp3');
    }

    // 4) Micro désactivé pour USER2 → burp.mp3 (seulement si pas en sourdine)
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
