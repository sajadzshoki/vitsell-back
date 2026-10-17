import technolifeConfig from '#config/technolife'

type LogoStripRuntime = {
  stripLogo?: boolean
  stripLogoForce?: boolean
}

let override: LogoStripRuntime = {}

/** Per-process override for CLI flags (`--keep-logo`, `--force-strip-logo`). */
export function setTechnolifeLogoStripOverride(next: LogoStripRuntime) {
  override = { ...override, ...next }
}

export function clearTechnolifeLogoStripOverride() {
  override = {}
}

export function resolveTechnolifeLogoStripOptions() {
  return {
    stripLogo: override.stripLogo ?? technolifeConfig.stripLogo,
    stripLogoForce: override.stripLogoForce ?? technolifeConfig.stripLogoForce,
  }
}
