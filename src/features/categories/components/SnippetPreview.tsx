interface Props {
  title: string;
  description: string;
  slug: string;
}

const STOREFRONT = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'https://urgentprinters.com').replace(/\/$/, '');

export function SnippetPreview({ title, description, slug }: Props) {
  const host = STOREFRONT.replace(/^https?:\/\//, '');
  return (
    <div className="rounded-lg border border-border bg-background p-3" data-testid="snippet-preview">
      <p className="text-[11px] text-muted-foreground mb-1">Google preview</p>
      <p className="text-xs text-muted-foreground truncate">{host} › products › {slug || 'slug'}</p>
      <p className="text-base leading-snug text-[#1a0dab] dark:text-[#8ab4f8] truncate">{title || 'Category title'}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{description || 'Add a meta description to control what appears under the title.'}</p>
    </div>
  );
}
