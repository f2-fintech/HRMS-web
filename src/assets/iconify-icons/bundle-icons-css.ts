/**
 * This is an advanced example for creating icon bundles for Iconify SVG Framework.
 *
 * It creates a bundle from:
 * - All SVG files in a directory.
 * - Custom JSON files.
 * - Iconify icon sets.
 * - SVG framework.
 *
 * This example uses Iconify Tools to import and clean up icons.
 * For Iconify Tools documentation visit https://docs.iconify.design/tools/tools2/
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'

// Installation: npm install --save-dev @iconify/tools @iconify/utils @iconify/json @iconify/iconify
import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import type { IconifyJSON } from '@iconify/types'
import { getIcons, getIconsCSS, stringToIcon } from '@iconify/utils'

/**
 * Script configuration
 */
interface BundleScriptCustomSVGConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to SVG files
  dir: string

  // True if icons should be treated as monotone: colors replaced with currentColor
  monotone: boolean

  // Icon set prefix
  prefix: string
}

interface BundleScriptCustomJSONConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to JSON file
  filename: string

  // List of icons to import. If missing, all icons will be imported
  icons?: string[]
}

interface BundleScriptConfig {
  // eslint-disable-next-line lines-around-comment
  // Custom SVG to import and bundle
  svg?: BundleScriptCustomSVGConfig[]

  // Icons to bundled from @iconify/json packages
  icons?: string[]

  // List of JSON files to bundled
  // Entry can be a string, pointing to filename or a BundleScriptCustomJSONConfig object (see type above)
  // If entry is a string or object without 'icons' property, an entire JSON file will be bundled
  json?: (string | BundleScriptCustomJSONConfig)[]
}

const sources: BundleScriptConfig = {
  json: [
    // Iconify JSON file (@iconify/json is a package name, /json/ is directory where files are, then filename)
    require.resolve('@iconify/json/json/ri.json'),

    // Custom file with only few icons
    {
      filename: require.resolve('@iconify/json/json/line-md.json'),
      icons: ['home-twotone-alt', 'github', 'document-list', 'document-code', 'image-twotone']
    }

    // Custom JSON file
    // 'json/gg.json'
  ],

  icons: [
    'bx-basket',
    'bi-airplane-engines',
    'tabler-anchor',
    'uit-adobe-alt',

    // 'fa6-regular-comment',
    'twemoji-auto-rickshaw'
  ],

  svg: [
    /* {
      dir: 'src/assets/iconify-icons/svg',
      monotone: false,
      prefix: 'custom'
    } */
    /* {
      dir: 'src/assets/iconify-icons/emojis',
      monotone: false,
      prefix: 'emoji'
    } */
  ]
}

// File to save bundle to
const outputDir = join(__dirname, 'generated');

/**
 * Do stuff!
 */
; (async function () {
  // Create directory for output if missing
  try {
    await fs.mkdir(outputDir, {
      recursive: true
    })
  } catch (err) {
    //
  }

  // Clean up the output directory
  const files = await fs.readdir(outputDir);
  for (const file of files) {
    await fs.unlink(join(outputDir, file));
  }

  const allIcons: IconifyJSON[] = []

  /**
   * Convert sources.icons to sources.json
   */
  if (sources.icons) {
    const sourcesJSON = sources.json ? sources.json : (sources.json = [])

    // Sort icons by prefix
    const organizedList = organizeIconsList(sources.icons)

    for (const prefix in organizedList) {
      const filename = require.resolve(`@iconify/json/json/${prefix}.json`)

      sourcesJSON.push({
        filename,
        icons: organizedList[prefix]
      })
    }
  }

  /**
   * Bundle JSON files and collect icons
   */
  if (sources.json) {
    for (let i = 0; i < sources.json.length; i++) {
      const item = sources.json[i]

      // Load icon set
      const filename = typeof item === 'string' ? item : item.filename
      const content = JSON.parse(await fs.readFile(filename, 'utf8')) as IconifyJSON
      const prefix = content.prefix;

      // Filter icons
      if (typeof item !== 'string' && item.icons?.length) {
        const filteredContent = getIcons(content, item.icons)

        if (!filteredContent) throw new Error(`Cannot find required icons in ${filename}`)

        // Generate CSS for the filtered icons
        const cssContent = getIconsCSS(filteredContent, Object.keys(filteredContent.icons), { iconSelector: '.{prefix}-{name}' });
        await fs.writeFile(join(outputDir, `${prefix}.css`), cssContent, 'utf8');

      } else {
        // Generate CSS for all icons in the JSON file
        const cssContent = getIconsCSS(content, Object.keys(content.icons), { iconSelector: '.{prefix}-{name}' });
        await fs.writeFile(join(outputDir, `${prefix}.css`), cssContent, 'utf8');
      }
    }
  }

  /**
   * Bundle custom SVG icons and collect icons
   */
  if (sources.svg) {
    for (let i = 0; i < sources.svg.length; i++) {
      const source = sources.svg[i]

      // Import icons
      const iconSet = await importDirectory(source.dir, {
        prefix: source.prefix
      })

      // Validate, clean up, fix palette, etc.
      await iconSet.forEach(async (name, type) => {
        if (type !== 'icon') return

        // Get SVG instance for parsing
        const svg = iconSet.toSVG(name)

        if (!svg) {
          // Invalid icon
          iconSet.remove(name)

          return
        }

        // Clean up and optimise icons
        try {
          // Clean up icon code
          await cleanupSVG(svg)

          if (source.monotone) {
            // Replace color with currentColor, add if missing
            // If icon is not monotone, remove this code
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => {
                return !color || isEmptyColor(color) ? colorStr : 'currentColor'
              }
            })
          }

          // Optimise
          await runSVGO(svg)
        } catch (err) {
          // Invalid icon
          console.error(`Error parsing ${name} from ${source.dir}:`, err)
          iconSet.remove(name)

          return
        }

        // Update icon from SVG instance
        iconSet.fromSVG(name, svg)
      })

      // Generate CSS from the SVG icons
      const cssContent = getIconsCSS(iconSet.export(), Object.keys(iconSet.export().icons), { iconSelector: '.{prefix}-{name}' });
      await fs.writeFile(join(outputDir, `${source.prefix}.css`), cssContent, 'utf8');
    }
  }

  // Create an index.ts file to import all generated CSS files
  const generatedFiles = await fs.readdir(outputDir);
  const indexContent = generatedFiles.map(file => `import './${file}';`).join('\n');
  await fs.writeFile(join(outputDir, 'index.ts'), indexContent, 'utf8');

  console.log(`Saved CSS to ${outputDir}!`)
})().catch(err => {
  console.error(err)
})

/**
 * Sort icon names by prefix
 */
function organizeIconsList(icons: string[]): Record<string, string[]> {
  const sorted: Record<string, string[]> = Object.create(null)

  icons.forEach(icon => {
    const item = stringToIcon(icon)

    if (!item) return

    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])

    const name = item.name

    if (!prefixList.includes(name)) prefixList.push(name)
  })

  return sorted
}
