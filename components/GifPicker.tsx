"use client";

import { useEffect, useState } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

export default function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const [gf, setGf] = useState<GiphyFetch | null>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (key) setGf(new GiphyFetch(key));
    setWidth(Math.min(window.innerWidth - 80, 360));
  }, []);

  if (!gf) {
    return <div className="text-sm p-3 opacity-70">Add NEXT_PUBLIC_GIPHY_API_KEY to enable GIFs.</div>;
  }

  const fetchGifs = (offset: number) =>
    query.trim() ? gf.search(query, { offset, limit: 10 }) : gf.trending({ offset, limit: 10 });

  return (
    <div className="p-2 w-[360px] max-w-[90vw]">
      <input
        className="paw-input mb-2"
        placeholder="Search GIFs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-72 overflow-y-auto">
        <Grid
          key={query}
          width={width}
          columns={2}
          fetchGifs={fetchGifs}
          onGifClick={(gif, e) => {
            e.preventDefault();
            const url = gif.images.fixed_width.url;
            onSelect(url);
          }}
          noLink
        />
      </div>
    </div>
  );
}
