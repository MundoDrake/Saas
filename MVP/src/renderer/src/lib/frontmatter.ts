export interface FrontmatterData extends Record<string, any> {
    title?: string;
    status?: string;
    id?: string;
    tags?: string[];
    created_at?: string;
}

export function parseFrontmatter(text: string): { attributes: FrontmatterData, body: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = text.match(frontmatterRegex);

    if (!match) {
        return { attributes: {}, body: text };
    }

    const yamlBlock = match[1];
    const body = text.replace(frontmatterRegex, '');
    const attributes: FrontmatterData = {};

    yamlBlock.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();

            // Basic value parsing
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith('[') && value.endsWith(']')) {
                // Very basic array parsing for tags
                const arrayContent = value.slice(1, -1);
                attributes[key] = arrayContent.split(',').map(v => v.trim().replace(/['"]/g, '')).filter(Boolean);
                return;
            }

            attributes[key] = value;
        }
    });

    return { attributes, body };
}

export function stringifyFrontmatter(attributes: FrontmatterData, body: string): string {
    let yaml = '---\n';

    // Ensure ID is usually first (convention)
    if (attributes.id) yaml += `id: ${attributes.id}\n`;

    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'id') continue; // Already handled
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
            yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
        } else {
            yaml += `${key}: ${value}\n`;
        }
    }

    yaml += '---\n';
    return yaml + body;
}
