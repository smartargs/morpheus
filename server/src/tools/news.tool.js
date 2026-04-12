/**
 * Fetches latest Neo N3 news from NeoNewsToday RSS feed.
 */
export async function get_neo_news({ count = 5 } = {}) {
  const res = await fetch('https://neonewstoday.com/feed/');
  if (!res.ok) throw new Error(`RSS feed returned ${res.status}`);

  const xml = await res.text();
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < count) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
      || block.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      || block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1]
      || '';
    const categories = [];
    const catRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>|<category>(.*?)<\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1] || catMatch[2]);
    }

    items.push({
      title,
      link,
      pubDate,
      summary: description.replace(/<[^>]+>/g, '').trim().slice(0, 300),
      categories,
    });
  }

  if (items.length === 0) {
    return { success: false, error: 'No news items found in the feed.' };
  }

  return { success: true, count: items.length, articles: items };
}
