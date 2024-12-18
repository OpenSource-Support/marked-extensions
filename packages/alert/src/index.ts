import type { MarkedExtension, Tokens } from 'marked'
import type { Alert, AlertVariantItem, Options } from './types.js'
import { createSyntaxPattern, resolveVariants, ucfirst } from './utils.js'

export type { Alert, AlertVariantItem, Options }

/**
 * A [marked](https://marked.js.org/) extension to support [GFM alerts](https://github.com/orgs/community/discussions/16925).
 */
export default function markedAlert(options: Options = {}): MarkedExtension {
  const { className = 'markdown-alert', variants = [] } = options
  const resolvedVariants = resolveVariants(variants)

  return {
    walkTokens(token) {
      if (token.type !== 'blockquote') return

      const matchedVariant = resolvedVariants.find(({ type }) =>
        new RegExp(createSyntaxPattern(type)).test(token.text)
      )

      if (matchedVariant) {
        const {
          type: variantType,
          icon,
          title = ucfirst(variantType),
          titleClassName = `${className}-title`
        } = matchedVariant
        const typeRegexp = new RegExp(createSyntaxPattern(variantType))

        Object.assign(token, {
          type: 'alert',
          meta: {
            className,
            variant: variantType,
            icon,
            title,
            titleClassName
          }
        })

        const firstLine = token.tokens?.[0] as Tokens.Paragraph
        const firstLineText = firstLine.raw?.replace(typeRegexp, '').trim()

        if (firstLineText) {
          const patternToken = firstLine.tokens[0] as Tokens.Text

          Object.assign(patternToken, {
            raw: patternToken.raw.replace(typeRegexp, ''),
            text: patternToken.text.replace(typeRegexp, '')
          })

          if (firstLine.tokens[1]?.type === 'br') {
            firstLine.tokens.splice(1, 1)
          }
        } else {
          token.tokens?.shift()
        }
      }
    },
    extensions: [
      {
        name: 'alert',
        level: 'block',
        renderer({ meta, tokens = [] }) {
          let tmpl = `<div class="${meta.className} ${meta.className}-${meta.variant}">\n`
          tmpl += `<p class="${meta.titleClassName}">`
          tmpl += meta.icon
          tmpl += meta.title
          tmpl += '</p>\n'
          tmpl += this.parser.parse(tokens)
          tmpl += '</div>\n'

          return tmpl
        }
      }
    ]
  }
}
