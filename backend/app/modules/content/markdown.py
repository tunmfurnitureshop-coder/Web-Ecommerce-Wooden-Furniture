import mistune
import bleach

_ALLOWED_TAGS = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br",
    "ul", "ol", "li",
    "strong", "em", "b", "i",
    "a",
    "img",
    "blockquote",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr",
    "code", "pre",
]

_ALLOWED_ATTRS = {
    "a": ["href", "title", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
}

_md = mistune.create_markdown(escape=False)


def render_markdown(raw: str) -> str:
    """Convert markdown to sanitized HTML. Strips script, iframe, and raw HTML."""
    html = _md(raw)
    clean = bleach.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        strip=True,
    )
    return clean
