import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  REST,
  Routes,
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// ✅ Ensure commands folder exists
const commandsPath = path.join(__dirname, "commands");
if (!fs.existsSync(commandsPath)) {
  fs.mkdirSync(commandsPath);
  console.log("📁 Created missing 'commands' folder. Place your command files there.");
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
const commandsArray = [];

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
  commandsArray.push(command.default.data.toJSON());
}

// When the bot starts
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: "dnd",
    activities: [{ name: "discord.gg/cuban", type: ActivityType.Watching }],
  });

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("🔄 Registering slash commands...");

    // ✅ Register commands globally (takes up to 1 hour to appear everywhere)
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandsArray });

    // 💡 If you want INSTANT commands, uncomment this line and put your test server ID
    await rest.put(Routes.applicationGuildCommands(client.user.id, "bot_id"), { body: commandsArray });

    console.log("✅ Slash commands registered successfully.");
  } catch (err) {
    console.error("❌ Error registering slash commands:", err);
  }
});

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
    }
  }

  // Button interactions
  if (interaction.isButton()) {
    // Create Ticket
    if (interaction.customId === "create_ticket") {
      const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
      if (existing) {
        return interaction.reply({ content: "❗ You already have an open ticket.", ephemeral: true });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"] },
          { id: client.user.id, allow: ["ViewChannel", "SendMessages", "ManageChannels"] },
        ],
      });

      const deleteButton = new ButtonBuilder()
        .setCustomId("delete_ticket")
        .setLabel("🗑️ Delete Ticket")
        .setStyle(ButtonStyle.Danger);

      const deleteRow = new ActionRowBuilder().addComponents(deleteButton);

      await ticketChannel.send({
        content: `🎫 **Ticket created by ${interaction.user}!**\nA staff member will be with you shortly.\nPress 🗑️ below to delete this ticket.`,
        components: [deleteRow],
      });

      await interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });
    }

    // Delete Ticket
    if (interaction.customId === "delete_ticket") {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({ content: "❌ This isn't a ticket channel.", ephemeral: true });
      }

      await interaction.reply({ content: "🗑️ Deleting this ticket in 5 seconds...", ephemeral: true });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }
});

client.login(process.env.TOKEN);

