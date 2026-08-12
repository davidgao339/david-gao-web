import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json

output_csv_sales = 'cafe_sales.csv'
output_csv_sku = 'cafe_sku.csv'
output_json = 'cafe_metrics.json'

print("Generating 2 years of cafe data...")
categories = {
    'Coffee': ['Espresso', 'Latte', 'Cappuccino', 'Drip Coffee', 'Cold Brew', 'Americano'],
    'Tea': ['Matcha', 'Chai Latte', 'Iced Tea'],
    'Pastries': ['Croissant', 'Blueberry Muffin', 'Chocolate Chip Cookie', 'Scone'],
    'Food': ['Breakfast Sandwich', 'Avocado Toast'],
    'Merchandise': ['Whole Bean Coffee', 'Travel Mug']
}

sku_list = []
sku_id_counter = 1
prices = {
    'Coffee': (3.00, 6.50), 'Tea': (4.00, 6.00), 'Pastries': (3.50, 5.50),
    'Food': (7.00, 12.00), 'Merchandise': (15.00, 25.00)
}

for cat, subcats in categories.items():
    for sub in subcats:
        for _ in range(random.randint(1, 3)):
            sku_id = f"SKU{sku_id_counter:03d}"
            sku_list.append({
                'sku_id': sku_id, 'sku_name': f"{sub} Variation {_ + 1}",
                'category': cat, 'subcategory': sub,
                'unit_price': round(random.uniform(prices[cat][0], prices[cat][1]), 2)
            })
            sku_id_counter += 1

sku_df = pd.DataFrame(sku_list)
sku_df.to_csv(output_csv_sku, index=False)

start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)
days = (end_date - start_date).days + 1

receipts = []
receipt_id_counter = 1
daily_target_base = 20000 / 30 # roughly $666 per day

for day in range(days):
    current_date = start_date + timedelta(days=day)
    # Add seasonality (higher in summer and winter)
    month = current_date.month
    season_multiplier = 1.0
    if month in [6,7,8]: season_multiplier = 1.2
    elif month in [11,12]: season_multiplier = 1.3
    
    # 2025 has 10% growth over 2024
    year_multiplier = 1.0 if current_date.year == 2024 else 1.1

    daily_target = daily_target_base * season_multiplier * year_multiplier * random.uniform(0.8, 1.2)
    daily_revenue = 0
    
    while daily_revenue < daily_target:
        receipt_id = f"R{receipt_id_counter:06d}"
        num_items = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
        
        for _ in range(num_items):
            cat_weights = sku_df['category'].map({'Coffee': 10, 'Tea': 5, 'Pastries': 8, 'Food': 3, 'Merchandise': 0.5})
            chosen_sku = sku_df.sample(1, weights=cat_weights).iloc[0]
            
            quantity = random.choices([1, 2, 3], weights=[0.8, 0.15, 0.05])[0]
            total_val = quantity * chosen_sku['unit_price']
            
            receipts.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'receipt_id': receipt_id,
                'sku_id': chosen_sku['sku_id'],
                'quantity': quantity,
                'unit_price': chosen_sku['unit_price'],
                'total_value': total_val
            })
            daily_revenue += total_val
        receipt_id_counter += 1

sales_df = pd.DataFrame(receipts)
sales_df.to_csv(output_csv_sales, index=False)
print(f"Generated {len(sales_df)} sales records.")

output_js = 'data.js'

print("Aggregating metrics for dashboard...")
sales_joined = pd.merge(sales_df, sku_df[['sku_id', 'sku_name', 'category', 'subcategory']], on='sku_id', how='left')

# Daily granular data
daily_data = sales_joined.groupby(['date', 'category', 'subcategory']).agg(
    revenue=('total_value', 'sum'),
    quantity=('quantity', 'sum'),
    orders=('receipt_id', 'nunique')
).reset_index().to_dict('records')

metrics = {
    'daily_data': daily_data
}

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

with open(output_js, 'w') as f:
    json_str = json.dumps(metrics, cls=NpEncoder)
    f.write(f"const cafeData = {json_str};")

print("Saved JS metrics to", output_js)
