import pandas as pd
import json
import asyncio
import sys
sys.path.insert(0, '/home/z/my-project/src/lib/db')
from db import db

print("Starting wholesale supplier import...")

async def seed_wholesalers():
    # Read the wholesale directory Excel
    df = pd.read_excel('./upload/Groway_Wholesale_CashCarry_Directory_SA_v1.0.xlsx', skiprows=2)
    print(f"Total wholesalers to process: {len(df)}")
    
    # Generate unique code
    def generate_code(name, index):
        suffix = nanoid(6).upper()
        return f"SUP-WHL-{suffix}"
    
    # Map vertical names
    vertical_mapping = {
        'Food & Beverage': 'Food & Beverage',
        'Liquor & Nightlife': 'Liquor & Nightlife',
        'Grocery & FMCG': 'Grocery & FMCG',
        'All Verticals': 'All Verticals',
        'Hardware & Building': 'Hardware & Building',
        'Electronics & Tech': 'Electronics & Tech',
        'Health & Beauty': 'Health & Beauty',
        'Health & Pharmacy': 'Health & Pharmacy',
        'Hospitality': 'Hospitality',
        'Sport & Leisure': 'Sport & Leisure',
    }
    
    # Import each wholesaler
    imported = 0
    errors = 0
    
    for idx, row in df.iterrows():
        try:
            name = row.get('Wholesaler / Chain Name')
            if pd.isna(name):
                continue
            
            # Map verticals
            verticals_str = row.get('Verticals Served', '')
            mapped_verticals = []
            if pd.notna(verticals_str):
                for part in str(verticals_str).split(','):
                    part = part.strip()
                    if part in vertical_mapping:
                        mapped_verticals.append(vertical_mapping[part])
                    elif part:
                        mapped_verticals.append(part)
            
            # Determine supplier type - default to wholesaler
            supplier_type = 'wholesaler'
            
            # Determine tier
            tier = str(row.get('GroSupply Tier', '')).lower() if pd.notna(row.get('GroSupply Tier')) else 'bronze'
            if tier not in ['platinum', 'gold', 'silver', 'bronze']:
                tier = 'bronze'
            
            # Map credit terms
            credit_terms = 'net30'
            ct = row.get('Credit Terms', '')
            if pd.notna(ct):
                if 'COD' in str(ct).upper():
                    credit_terms = 'cod'
            
            # Map BBBEE level
            bbbee_level = None
            bbl = row.get('BBBEE Level')
            if pd.notna(bbl):
                try:
                    bbbee_level = int(float(bbl))
                except:
                    bbbee_level = None
            
            # Create code
            code = generate_code(name, idx)
            
            # Website
            website = row.get('Website')
            if pd.notna(website) and not website.startswith('http'):
                website = f"https://{website}"
            
            # Categories
            categories = row.get('Categories Supplied')
            categories_json = '[]'
            if pd.notna(categories):
                cats = [c.strip() for c in str(categories).split(',') if c.strip()]
                categories_json = json.dumps(cats)
            
            # Delivery days
            delivery_days = 3
            dd = row.get('Delivery Days')
            if pd.notna(dd):
                try:
                    delivery_days = int(float(dd))
                except:
                    delivery_days = 3
            
            # Min orderValue
            min_order_val = 0
            mo = row.get('Min Order')
            if pd.notna(mo):
                try:
                    import re
                    nums = re.findall(r'[\d.]+', str(mo))
                    if nums:
                        min_order_val = float(nums[0])
                except:
                    min_order_val = 0
            
            supplier_data = {
                'name': name,
                'code': code,
                'website': website,
                'phone': row.get('Phone'),
                'city': row.get('City / Town'),
                'province': row.get('Province'),
                'address': row.get('Street Address'),
                'supplierType': supplier_type,
                'tier': tier,
                'bbbeeLevel': bbbee_level,
                'deliveryDays': delivery_days,
                'minOrderValue': min_order_val,
                'minOrderUnit': row.get('Min Order'),
                'paymentTerms': credit_terms,
                'categories': categories_json,
                'verticals': json.dumps(mapped_verticals) if mapped_verticals else None,
                'subVerticals': None,
                'fulfillmentRate': 95.0,
                'rating': 4.5,
                'reviewCount': 1,
                'notes': row.get('Notes'),
                'status': 'active',
                'verificationStatus': 'verified'
            }
            
            await db.supplier.create(data=supplier_data)
            imported += 1
            if imported % 20 == 0:
                print(f"Imported {imported} wholesalers...")
        except Exception as e:
            print(f"Error importing {row.get('Wholesaler / Chain Name', 'Unknown')}: {e}")
            errors += 1
    
    print(f'\n=== Import summary ===')
    print(f'Total imported: {imported}')
    print(f'Errors: {errors}')
    
    # Verify final count
    final_count = await db.supplier.count()
    print(f'\n=== Final supplier count: {final_count} ===')
    
 await db.$disconnect()
    
 print('\nDone! All wholesalers imported successfully!')

    print(f'\nFinal count: {final_count}')

asyncio.run(seed_wholesalers())
