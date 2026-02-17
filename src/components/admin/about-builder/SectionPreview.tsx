import { MapPin, Heart, Star, Users, Award, Building2 } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Star, Users, Award, MapPin, Building2,
};

interface SectionData {
  id: string;
  section_type: string;
  title: string | null;
  content: Record<string, any>;
  styling: Record<string, any>;
  is_visible: boolean;
}

interface Props {
  sections: SectionData[];
}

const bgClasses: Record<string, string> = {
  default: 'bg-background',
  card: 'bg-card',
  primary: 'bg-primary/5',
  muted: 'bg-muted',
};

const paddingClasses: Record<string, string> = {
  small: 'py-4',
  normal: 'py-8',
  large: 'py-12',
};

const alignClasses: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function SectionPreview({ sections }: Props) {
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background text-foreground" style={{ fontSize: '10px' }}>
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] text-muted-foreground">Preview — Tentang Kami</span>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {visibleSections.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-xs">Belum ada section</div>
        )}
        {visibleSections.map((section) => (
          <PreviewSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function PreviewSection({ section }: { section: SectionData }) {
  const { content, styling, section_type } = section;
  const bg = bgClasses[styling?.bg_color] || '';
  const pad = paddingClasses[styling?.padding] || 'py-8';
  const align = alignClasses[styling?.text_align] || '';

  return (
    <div className={`${bg} ${pad} px-4 ${align}`}>
      {section_type === 'hero' && (
        <div className="space-y-1.5 max-w-[280px] mx-auto text-center">
          {content.subtitle && <p className="text-primary text-[9px] italic">{content.subtitle}</p>}
          <h2 className="font-serif font-bold text-sm leading-tight">{content.title || 'Hero Title'}</h2>
          {content.description && <p className="text-muted-foreground text-[8px] leading-relaxed">{content.description}</p>}
        </div>
      )}

      {section_type === 'text' && (
        <div className="space-y-1 max-w-[280px] mx-auto">
          {content.subtitle && <p className="text-primary text-[8px] italic">{content.subtitle}</p>}
          {content.title && <h3 className="font-serif font-bold text-xs">{content.title}</h3>}
          {content.description && <p className="text-muted-foreground text-[8px]">{content.description}</p>}
        </div>
      )}

      {section_type === 'text_columns' && (
        <div className="grid grid-cols-2 gap-3 max-w-[300px] mx-auto">
          <div className="space-y-1">
            {content.left_label && <p className="text-primary text-[7px] uppercase tracking-wider font-medium">{content.left_label}</p>}
            {content.left_title && <h3 className="font-serif font-bold text-[10px] leading-tight">{content.left_title}</h3>}
            {content.left_description && <p className="text-muted-foreground text-[7px]">{content.left_description}</p>}
          </div>
          <div className="space-y-1">
            {content.right_label && <p className="text-primary text-[7px] uppercase tracking-wider font-medium">{content.right_label}</p>}
            {(content.right_items || []).map((item: string, i: number) => (
              <p key={i} className="text-muted-foreground text-[7px] flex gap-1"><span className="text-primary">✦</span>{item}</p>
            ))}
          </div>
        </div>
      )}

      {section_type === 'values' && (
        <div className="space-y-2 max-w-[300px] mx-auto">
          {content.heading_script && <p className="text-primary text-[8px] italic">{content.heading_script}</p>}
          {content.heading && <h3 className="font-serif font-bold text-xs">{content.heading}</h3>}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(content.items || []).slice(0, 4).map((item: any, i: number) => {
              const Icon = iconMap[item.icon] || Heart;
              return (
                <div key={i} className="bg-card border border-border rounded-lg p-2 text-center">
                  <Icon className="w-3 h-3 text-primary mx-auto mb-1" />
                  <p className="font-bold text-[8px]">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {section_type === 'stats' && (
        <div className="flex justify-center gap-4 max-w-[300px] mx-auto">
          {(content.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center">
              <p className="font-serif font-bold text-primary text-sm">{item.number}</p>
              <p className="text-muted-foreground text-[7px]">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {section_type === 'cta' && (
        <div className="space-y-1.5 max-w-[280px] mx-auto text-center">
          {content.subtitle && <p className="text-primary text-[8px] italic">{content.subtitle}</p>}
          {content.title && <h3 className="font-serif font-bold text-xs">{content.title}</h3>}
          {content.description && <p className="text-muted-foreground text-[7px]">{content.description}</p>}
          <div className="flex gap-1 justify-center mt-1">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[7px]">{content.button_text || 'Button'}</span>
          </div>
        </div>
      )}

      {section_type === 'quote' && (
        <div className="max-w-[260px] mx-auto text-center space-y-1">
          <p className="text-[9px] italic text-muted-foreground">"{content.quote || 'Quote...'}"</p>
          {content.author && <p className="text-[8px] font-medium">— {content.author}</p>}
        </div>
      )}
    </div>
  );
}
