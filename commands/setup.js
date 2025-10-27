import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Set up the ticket system in a channel.")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("The channel to send the ticket panel to.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const createButton = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("🎫 Create Ticket")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(createButton);

    await channel.send({
      content: "**🎟️ Need help? Click the button below to open a support ticket.**",
      components: [row],
    });

    await interaction.reply({ content: `✅ Ticket panel created in ${channel}`, ephemeral: true });
  },
};
