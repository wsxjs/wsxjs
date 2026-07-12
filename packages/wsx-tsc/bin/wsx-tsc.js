#!/usr/bin/env node
import { run } from "../dist/index.js";

const args = process.argv.slice(2);
const projectArg = args.find((a) => a.startsWith("--project=") || a.startsWith("-p="));
const tsconfigPath = projectArg ? projectArg.split("=")[1] : "tsconfig.json";

run(tsconfigPath);
