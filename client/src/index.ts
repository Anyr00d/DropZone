#!/usr/bin/env node
import { Command } from "commander";
import { uploadCommand } from "./commands/upload.js";
import { downloadCommand } from "./commands/download.js";

const program = new Command();

program
  .name("dropzone")
  .description("Secure file drop CLI tool")
  .version("0.1.0");

program
  .command("upload")
  .description("Upload a file securely")
  .argument("<filepath>", "Path to file")
  .action(uploadCommand);

program
  .command("download")
  .description("Download a file using token")
  .argument("<token>", "Token received on upload")
  .action(downloadCommand);

program.parse();
