/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  let bonusCoefficient;

  switch (index) {
    case 0:
      bonusCoefficient = 0.15;
      break;

    case 1:
    case 2:
      bonusCoefficient = 0.1;
      break;

    case total - 1:
      bonusCoefficient = 0;
      break;

    default:
      bonusCoefficient = 0.05;
      break;
  }

  const totalBonus = profit * bonusCoefficient;
  return totalBonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0 || !data.purchase_records || data.purchase_records.length === 0) {
    throw new Error("Некорректные входные данные");
  }
  // @TODO: Проверка наличия опций
  let calculateRevenue = calculateSimpleRevenue;
  let calculateBonus = calculateBonusByProfit;
  if (
    typeof options === "object" &&
    options !== null &&
    typeof options.calculateRevenue === "function" &&
    typeof options.calculateBonus === "function"
  ) {
    const { calculateRevenue, calculateBonus } = options;
  } else {
    console.error("Не удалось загрузить обязательные функции из options.");
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
    top_products: [],
  }));
  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];

    if (!seller.sales_count) seller.sales_count = 0;
    seller.sales_count += 1;

    if (!seller.revenue) seller.revenue = 0;
    seller.revenue += record.total_amount;

    if (!seller.profit) seller.profit = 0;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      const cost = product.purchase_price * item.quantity;

      const revenue = calculateRevenue(item, product);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold) seller.products_sold = {};
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);
  // @TODO: Назначение премий на основе ранжирования
  const totalSellers = sellerStats.length;

  sellerStats.forEach((seller, index) => {
    // Назначение бонуса
    seller.bonus = calculateBonus(index, totalSellers, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
