import * as core from '@actions/core'
import * as system from './os'
import * as versions from './swift-versions'
import * as linux from './linux-install'

async function run() {
  let version = versions.verify(core.getInput('swift-version', { required: true }))

  let platform = await system.getSystem()
  switch (platform.os) {
    case system.OS.Ubuntu:
      await linux.install(version, platform)
      break
    default:
      core.setFailed(`${os} is not supported`)
      return
  }
}

run();
