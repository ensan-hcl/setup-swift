import { exec } from "@actions/exec";
import * as core from "@actions/core";
import * as toolCache from "@actions/tool-cache";

export async function setupKeys() {
  core.debug("Fetching verification keys");
  let path = await toolCache.downloadTool(
    "https://swift.org/keys/all-keys.asc"
  );

  core.debug("Importing verification keys");
  await exec(`gpg --import "${path}"`);

  core.debug("Refreshing keys");
  await refreshKeys();
}

export async function verify(signaturePath: string, packagePath: string) {
  core.debug("Verifying signature");
  await exec("gpg", ["--verify", signaturePath, packagePath]);
}

export async function refreshKeys() {
  const pool = ["hkp://keyserver.ubuntu.com"];

  for (const server of pool) {
    core.debug(`Refreshing keys from ${server}`);
    // 1st try...
    if (await refreshKeysFromServer(server)) {
      core.debug(`Refresh successful on first attempt`);
      return;
    }

    // 2nd try...
    if (await refreshKeysFromServer(server)) {
      core.debug(`Refresh successful on second attempt`);
      return;
    }
    core.debug(`Refresh failed`);
  }

  throw new Error("Failed to refresh keys from any server in the pool.");
}

function refreshKeysFromServer(server: string): Promise<boolean> {
  // Following https://www.swift.org/install/windows/#code-signing-on-windows
  const refreshKeys = '"A62A E125 BBBF BB96 A6E0  42EC 925C C1CC ED3D 1561" "8A74 9566 2C3C D4AE 18D9  5637 FAF6 989E 1BC1 6FEA"'
  return exec(`gpg --keyserver ${server} --refresh-keys ${refreshKeys}`)
    .then((code) => code === 0)
    .catch((error) => {
      core.warning(
        `An error occurred when trying to refresh keys from ${server}: ${error}`
      );
      return false;
    });
}
