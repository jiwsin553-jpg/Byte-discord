function detectIntent(content, config) {
  const text = content.toLowerCase();
  const hasSales = config.keywords.sales.some((k) => text.includes(k));
  const hasSupport = config.keywords.support.some((k) => text.includes(k));

  if (hasSales && !hasSupport) return "sales";
  if (hasSupport && !hasSales) return "support";
  if (hasSales && hasSupport) return "support";
  return null;
}

function detectProduct(content, config) {
  const text = content.toLowerCase();
  const match = config.products.find((product) => text.includes(product.id));
  return match ? match.id : null;
}

function detectFaq(content, config) {
  const text = content.toLowerCase();
  for (const [key, reply] of Object.entries(config.keywords.faq)) {
    if (text.includes(key)) {
      return reply;
    }
  }
  return null;
}

module.exports = {
  detectIntent,
  detectFaq,
  detectProduct
};
