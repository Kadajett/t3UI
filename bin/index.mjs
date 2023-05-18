#! /usr/bin/env node

import { execSync } from "child_process";
import pkg from "fs-extra";
import inquirer from "inquirer";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { copySync, readdirSync, existsSync, readJsonSync, writeJsonSync } = pkg;

const componentDirectory = join(__dirname, "..", "src", "components");

// Get the names of all components
const components = readdirSync(componentDirectory);

const configFileName = "t3ui.config.json";

// Function to prompt the user for the destination folder
async function promptForDestination() {
  const { destination } = await inquirer.prompt([
    {
      type: "input",
      name: "destination",
      message: "Where do you want to add this component?",
    },
  ]);
  return destination;
}

function checkTailwindConfigAndPackage() {
  const tailwindTSConfigExists = existsSync("tailwind.config.ts");
  const tailwindJSConfigExists = existsSync("tailwind.config.js");
  let classVarianceAuthorityExists = false;
  try {
    console.log("Checking for class-variance-authority");
    console.log(execSync("npm list class-variance-authority"));
    classVarianceAuthorityExists = true;
  } catch (error) {
    throw new Error("npm package class-variance-authority not found");
  }

  if (!tailwindJSConfigExists && !tailwindTSConfigExists) {
    throw new Error(
      "tailwind.config.js or tailwind.config.ts not found in root of project directory"
    );
  }
  return (
    (tailwindJSConfigExists || tailwindTSConfigExists) &&
    classVarianceAuthorityExists
  );
}

async function main() {
  let componentDestination;

  // Check if the t3ui.config.json file exists
  if (existsSync(configFileName)) {
    // If it does, read the destination directory from it
    const config = readJsonSync(configFileName);
    componentDestination = config.componentDirectory;
  } else {
    // If it doesn't, prompt the user for the directory and save it to the config file
    componentDestination = await promptForDestination();
    const config = {
      componentDirectory: componentDestination,
    };
    writeJsonSync(configFileName, config);
  }

  checkTailwindConfigAndPackage();

  const { component } = await inquirer.prompt([
    {
      type: "list",
      name: "component",
      message: "Which component do you want to add? asdf",
      choices: components,
    },
  ]);

  // Copy the component to the user's specified destination
  const componentPath = join(componentDirectory, component);
  let destinationPath;
  try {
    destinationPath = resolve(componentDestination, component);
    if (!destinationPath) {
      throw new Error("Invalid destination path");
    }
  } catch (error) {
    console.error("Could not resolve destination path", error);
    return;
  }

  try {
    copySync(componentPath, destinationPath);
  } catch (error) {
    console.error("Could not copy component", error);
    return;
  }
  console.log(`Component ${component} was added to ${destinationPath}`);
}

main().catch((error) => {
  console.log("An error occurred:", error);
});
