import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json
from collections import defaultdict
from itertools import combinations

output_csv_sales = 'cafe_sales.csv'
output_csv_sku = 'cafe_sku.csv'
output_js = 'data.js'

print("Generating 2 years of advanced cafe data...")
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
cost_margins = {
    'Coffee': 0.15, 'Tea': 0.15, 'Pastries': 0.35, # high margin
    'Food': 0.45, 'Merchandise': 0.50 # lower margin
}

for cat, subcats in categories.items():
    for sub in subcats:
        for _ in range(random.randint(1, 3)):
            sku_id = f"SKU{sku_id_counter:03d}"
            price = round(random.uniform(prices[cat][0], prices[cat][1]), 2)
            cost = round(price * cost_margins[cat] * random.uniform(0.9, 1.1), 2)
            sku_list.append({
                'sku_id': sku_id, 'sku_name': f"{sub} Variation {_ + 1}",
                'category': cat, 'subcategory': sub,
                'unit_price': price,
                'unit_cost': cost
            })
            sku_id_counter += 1

sku_df = pd.DataFrame(sku_list)
sku_df.to_csv(output_csv_sku, index=False)

start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)
days = (end_date - start_date).days + 1

# Customer loyalty setup
num_customers = 5000
regulars = set(random.sample(range(1, num_customers+1), 500)) # 10% are regulars

receipts = []
receipt_id_counter = 1
daily_target_base = 20000 / 30

for day in range(days):
    current_date = start_date + timedelta(days=day)
    day_of_week = current_date.weekday() # 0 = Monday, 6 = Sunday
    
    # Seasonality
    month = current_date.month
    season_multiplier = 1.0
    if month in [6,7,8]: season_multiplier = 1.2
    elif month in [11,12]: season_multiplier = 1.3
    
    # Day of week multiplier (busier weekends)
    dow_multiplier = 1.3 if day_of_week in [5, 6] else 1.0
    year_multiplier = 1.0 if current_date.year == 2024 else 1.1

    daily_target = daily_target_base * season_multiplier * dow_multiplier * year_multiplier * random.uniform(0.8, 1.2)
    daily_revenue = 0
    
    # Time of day distribution weights (7AM to 5PM)
    # Peak at 8-9AM, minor peak 12-1PM
    hours = list(range(7, 18))
    hour_weights = [5, 15, 20, 10, 8, 12, 10, 7, 5, 4, 4] 
    
    while daily_revenue < daily_target:
        receipt_id = f"R{receipt_id_counter:06d}"
        
        # Determine customer
        if random.random() < 0.6: # 60% of traffic is regulars
            customer_id = f"C{random.choice(list(regulars)):05d}"
            is_returning = True
        else:
            customer_id = f"C{random.randint(1, num_customers):05d}"
            is_returning = customer_id in regulars
            
        hour = random.choices(hours, weights=hour_weights)[0]
        minute = random.randint(0, 59)
        timestamp = current_date.replace(hour=hour, minute=minute)
        
        num_items = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
        
        items_in_receipt = []
        for _ in range(num_items):
            cat_weights = sku_df['category'].map({'Coffee': 10, 'Tea': 5, 'Pastries': 8, 'Food': 3, 'Merchandise': 0.5})
            chosen_sku = sku_df.sample(1, weights=cat_weights).iloc[0]
            
            quantity = random.choices([1, 2], weights=[0.9, 0.1])[0]
            total_val = quantity * chosen_sku['unit_price']
            total_cost = quantity * chosen_sku['unit_cost']
            
            receipts.append({
                'timestamp': timestamp,
                'date': current_date.strftime('%Y-%m-%d'),
                'day_of_week': current_date.strftime('%A'),
                'hour': hour,
                'receipt_id': receipt_id,
                'customer_id': customer_id,
                'is_returning': is_returning,
                'sku_id': chosen_sku['sku_id'],
                'quantity': quantity,
                'unit_price': chosen_sku['unit_price'],
                'unit_cost': chosen_sku['unit_cost'],
                'total_value': total_val,
                'total_cost': total_cost
            })
            daily_revenue += total_val
        receipt_id_counter += 1

sales_df = pd.DataFrame(receipts)
sales_df.to_csv(output_csv_sales, index=False)
print(f"Generated {len(sales_df)} sales records.")

print("Aggregating advanced metrics for dashboard...")
sales_joined = pd.merge(sales_df, sku_df[['sku_id', 'sku_name', 'category', 'subcategory']], on='sku_id', how='left')
sales_joined['returning_revenue'] = np.where(sales_joined['is_returning'], sales_joined['total_value'], 0)
sales_joined['new_revenue'] = np.where(~sales_joined['is_returning'], sales_joined['total_value'], 0)

# 1. Daily granular data
daily_data = sales_joined.groupby(['date', 'category', 'subcategory']).agg(
    revenue=('total_value', 'sum'),
    cost=('total_cost', 'sum'),
    quantity=('quantity', 'sum'),
    orders=('receipt_id', 'nunique'),
    returning_revenue=('returning_revenue', 'sum'),
    new_revenue=('new_revenue', 'sum')
).reset_index().to_dict('records')

# 2. Heatmap Data (Day of Week vs Hour)
heatmap_data = sales_joined.groupby(['day_of_week', 'hour']).agg(
    revenue=('total_value', 'sum'),
    orders=('receipt_id', 'nunique')
).reset_index().to_dict('records')

# 3. Market Basket Analysis (Product Affinity)
receipt_groups = sales_joined.groupby('receipt_id')['category'].unique()
affinity = defaultdict(int)

for cats in receipt_groups:
    if len(cats) > 1:
        for pair in combinations(sorted(cats), 2):
            affinity[f"{pair[0]} + {pair[1]}"] += 1

top_affinity = sorted(affinity.items(), key=lambda x: x[1], reverse=True)[:5]
basket_data = [{'pair': k, 'count': v} for k, v in top_affinity]

metrics = {
    'daily_data': daily_data,
    'heatmap_data': heatmap_data,
    'basket_data': basket_data
}

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, pd.Timestamp): return obj.isoformat()
        return super(NpEncoder, self).default(obj)

with open(output_js, 'w') as f:
    json_str = json.dumps(metrics, cls=NpEncoder)
    f.write(f"const cafeData = {json_str};")

print("Saved advanced JS metrics to", output_js)
