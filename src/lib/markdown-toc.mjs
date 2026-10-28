// Turns an article's in-page menu into a styled contents box.
//
// Two ways of writing a menu in Markdown are recognised, at the top level of an article:
//   **In this review:** [Boarding](#boarding) · [Dinner](#dinner) · …
// or a plain bulleted list where every item is only a link to a heading:
//   - [What’s in it](#whats-in-it)
//   - [Why?](#why)
// Both become <nav class="toc"> with a label and a numbered list of links.

const isText = (n) => n.type === 'text';
const textOf = (n) => (isText(n) ? n.value : (n.children ?? []).map(textOf).join(''));
const isBlank = (n) => isText(n) && !n.value.trim();
const isHashLink = (n) =>
  n.type === 'element' && n.tagName === 'a' && String(n.properties?.href ?? '').startsWith('#');

/** Links from "**In this review:** [a](#a) · [b](#b)", or null if the paragraph isn't one. */
function fromLabelledParagraph(p) {
  if (p.tagName !== 'p') return null;
  const [first, ...rest] = p.children;
  if (!first || first.type !== 'element' || first.tagName !== 'strong') return null;
  const label = textOf(first).trim().replace(/:$/, '');
  if (!/^In this \w+$/i.test(label)) return null;
  const links = [];
  for (const n of rest) {
    if (isHashLink(n)) links.push(n);
    else if (!(isText(n) && /^[\s·•|,:]*$/.test(n.value))) return null;
  }
  return links.length >= 2 ? { label, links } : null;
}

/** Links from a bulleted list made only of links to headings, or null. */
function fromLinkList(ul) {
  if (ul.tagName !== 'ul') return null;
  const links = [];
  for (const li of ul.children) {
    if (isBlank(li)) continue;
    if (li.type !== 'element' || li.tagName !== 'li') return null;
    // A loose list wraps each item in <p>.
    const inner = li.children.flatMap((c) => (c.type === 'element' && c.tagName === 'p' ? c.children : [c]));
    const meaningful = inner.filter((c) => !isBlank(c));
    if (meaningful.length !== 1 || !isHashLink(meaningful[0])) return null;
    links.push(meaningful[0]);
  }
  return links.length >= 2 ? { label: null, links } : null;
}

const h = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });

/** Hast plugin for Astro's Markdown processor (Sätteri). */
export const tocPlugin = {
  name: 'leo-flies-toc',
  element: {
    filter: ['p', 'ul'],
    visit(node, ctx) {
      if (ctx.parent(node)?.type !== 'root') return; // only menus written at the top level
      const found = fromLabelledParagraph(node) ?? fromLinkList(node);
      if (!found) return;
      const path = ctx.fileURL ? decodeURIComponent(ctx.fileURL.pathname) : '';
      const label = found.label ?? (/\/guides\//.test(path) ? 'In this guide' : 'In this article');
      ctx.replaceNode(
        node,
        h('nav', { className: ['toc'], ariaLabel: label }, [
          h('p', { className: ['toc-label'] }, [{ type: 'text', value: label }]),
          h(
            'ol',
            { className: found.links.length > 6 ? ['toc-list', 'toc-columns'] : ['toc-list'] },
            // Long menus split into two columns; the second starts at `col-start`.
            found.links.map((a, i) =>
              h('li', i === Math.ceil(found.links.length / 2) && found.links.length > 6 ? { className: ['col-start'] } : {}, [a]),
            ),
          ),
        ]),
      );
    },
  },
};
