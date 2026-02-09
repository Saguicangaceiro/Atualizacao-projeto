import { InventoryItem } from "../types";

/**
 * Motor de sugestão local que substitui a IA.
 * Analisa a descrição da OS e cruza com o estoque disponível.
 */
export const suggestMaterialsLocally = (
  description: string,
  inventory: InventoryItem[]
): { material: string; reason: string }[] => {
  const descLower = description.toLowerCase();
  const suggestions: { material: string; reason: string }[] = [];

  // Keywords comuns e categorias
  const keywordsMap: Record<string, string> = {
    'vazamento': 'hidráulica',
    'cano': 'hidráulica',
    'torneira': 'hidráulica',
    'lâmpada': 'elétrica',
    'disjuntor': 'elétrica',
    'fio': 'elétrica',
    'curto': 'elétrica',
    'motor': 'mecânica',
    'rolamento': 'mecânica',
    'óleo': 'lubrificação',
    'graxa': 'lubrificação',
    'parede': 'civil',
    'pintura': 'civil',
    'porta': 'civil',
    'trava': 'segurança'
  };

  // 1. Tentar encontrar itens do estoque cujo nome aparece na descrição
  inventory.forEach(item => {
    const itemNameLower = item.name.toLowerCase();
    if (descLower.includes(itemNameLower) || itemNameLower.split(' ').some(word => word.length > 3 && descLower.includes(word))) {
      if (suggestions.length < 5) {
        suggestions.push({
          material: item.name,
          reason: `Detectado no texto da descrição (${item.quantity} ${item.unit} disponíveis).`
        });
      }
    }
  });

  // 2. Se poucas sugestões, buscar por categoria baseada em palavras-chave do problema
  if (suggestions.length < 3) {
    Object.entries(keywordsMap).forEach(([key, category]) => {
      if (descLower.includes(key)) {
        inventory
          .filter(i => i.category.toLowerCase() === category || i.name.toLowerCase().includes(key))
          .forEach(item => {
            if (!suggestions.find(s => s.material === item.name) && suggestions.length < 5) {
              suggestions.push({
                material: item.name,
                reason: `Item de ${item.category} sugerido para problemas de ${key}.`
              });
            }
          });
      }
    });
  }

  return suggestions;
};