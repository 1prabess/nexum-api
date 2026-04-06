export interface Block {
  type: string;
  content?: { type: string; text: string }[];
  children?: Block[];
}

export const extractText = (blocksOrString: Block[] | string): string => {
  let blocks: Block[];
  if (typeof blocksOrString === 'string') {
    try {
      blocks = JSON.parse(blocksOrString);
    } catch {
      return '';
    }
  } else {
    blocks = blocksOrString;
  }

  return blocks
    .map((block) => {
      const contentText = Array.isArray(block.content)
        ? block.content.map((c) => c.text).join(' ')
        : '';
      const childrenText = block.children ? extractText(block.children) : '';
      return [contentText, childrenText].filter(Boolean).join(' ');
    })
    .join(' ');
};
