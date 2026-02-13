// data.seed.js
window.PlusOpinion = window.PlusOpinion || {};
window.PlusOpinion.state = window.PlusOpinion.state || {};

// FEED POSTS
window.PlusOpinion.state.posts = [
    { id: 1, name: "Priya Sharma", username: "priya_s", avatar: "https://i.pravatar.cc/150?u=1", rqs: 86, verified: true, category: "Electronics", product: "OnePlus Nord 3", text: "Used this phone for 2 weeks — camera is excellent in daylight but struggles a bit in low light.", media: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=800&auto=format&fit=crop", time: "2h", agrees: 124, comments: 15, seenBy: "OnePlus" },
    { id: 2, name: "Vikram Singh", username: "vikram_ev", avatar: "https://i.pravatar.cc/150?u=8", rqs: 91, verified: true, category: "Automotive", product: "Ola S1 Pro Gen 2", text: "Range anxiety is gone. Getting solid 140km in Eco mode. The new front suspension is a massive upgrade over Gen 1.", media: "https://images.unsplash.com/photo-1623079400394-f07955bca462?q=80&w=800&auto=format&fit=crop", time: "4h", agrees: 89, comments: 21, seenBy: "Ola Electric" },
    { id: 3, name: "Anjali Gupta", username: "anjali_g", avatar: "https://i.pravatar.cc/150?u=5", rqs: 78, verified: false, category: "Skincare", product: "Minimalist 5% Niacinamide", text: "Been using for a month. Texture is light and non-sticky. Noticed slight reduction in blemishes but takes time.", media: null, time: "6h", agrees: 42, comments: 9, seenBy: null },
    { id: 4, name: "GamerX_99", username: "gamerx99", avatar: "https://i.pravatar.cc/150?u=12", rqs: 82, verified: true, category: "Gaming", product: "LG Ultragear 27\"", text: "144Hz feels buttery smooth. Colors are accurate straight out of the box. HDR is a bit weak but for competitive gaming, this is the one.", media: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop", time: "1d", agrees: 156, comments: 34, seenBy: "LG India" },
    { id: 5, name: "TechJunkie", username: "techie_j", avatar: "https://i.pravatar.cc/150?u=22", rqs: 94, verified: true, category: "Audio", product: "Sony WH-1000XM5", text: "ANC is out of this world. The comfort is improved from XM4, but I miss the folding design. Soundstage is wider.", media: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800&auto=format&fit=crop", time: "1d", agrees: 204, comments: 45, seenBy: "Sony" },
    { id: 6, name: "Sarah Jenkins", username: "sarah_eats", avatar: "https://i.pravatar.cc/150?u=30", rqs: 88, verified: false, category: "Food", product: "Starbucks Pumpkin Spice", text: "It's back! Honestly, feels a bit sweeter this year. I'd recommend asking for half the syrup pumps.", media: "https://images.unsplash.com/photo-1579992324875-57d52a26837c?q=80&w=800&auto=format&fit=crop", time: "2d", agrees: 312, comments: 50, seenBy: null },
    { id: 7, name: "David Chen", username: "dchen_dev", avatar: "https://i.pravatar.cc/150?u=33", rqs: 95, verified: true, category: "Software", product: "Cursor IDE", text: "The AI integration isn't a gimmick. It actually predicts my next block of code correctly 80% of the time. Game changer.", media: null, time: "3d", agrees: 450, comments: 80, seenBy: "Cursor" },
    { id: 8, name: "Emily Rose", username: "emrose_fit", avatar: "https://i.pravatar.cc/150?u=41", rqs: 79, verified: true, category: "Fashion", product: "Nike Dunk Low Panda", text: "Quality control is hit or miss. My pair had some glue stains, but the silhouette is classic. Fits true to size.", media: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop", time: "3d", agrees: 120, comments: 12, seenBy: "Nike" },
    { id: 9, name: "Rahul Verma", username: "rahul_v", avatar: "https://i.pravatar.cc/150?u=50", rqs: 85, verified: true, category: "Tech", product: "Samsung S24 Ultra", text: "The flat screen is finally here! S-Pen usability is vastly improved. Battery easily lasts 1.5 days.", media: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800&auto=format&fit=crop", time: "4d", agrees: 88, comments: 20, seenBy: "Samsung" },
    { id: 10, name: "MovieBuff22", username: "mbuff22", avatar: "https://i.pravatar.cc/150?u=55", rqs: 92, verified: false, category: "Entertainment", product: "Oppenheimer", text: "A masterpiece visually. The sound mixing was intense, maybe too loud in IMAX, but Cillian Murphy deserves the Oscar.", media: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop", time: "5d", agrees: 1024, comments: 200, seenBy: null },
    { id: 11, name: "Alice Cooper", username: "alice_c", avatar: "https://i.pravatar.cc/150?u=60", rqs: 81, verified: true, category: "Home", product: "Dyson V15 Detect", text: "The laser dust detection is horrifyingly good. You realize how dirty your floors actually are. Battery life is decent.", media: null, time: "5d", agrees: 67, comments: 5, seenBy: "Dyson" },
    { id: 12, name: "CryptoKing", username: "block_chain", avatar: "https://i.pravatar.cc/150?u=65", rqs: 70, verified: false, category: "Finance", product: "Coinbase App", text: "UI update is clean, but fees are still higher than competitors. Staking rewards view is much better now.", media: null, time: "6d", agrees: 40, comments: 10, seenBy: "Coinbase" },
    { id: 13, name: "Sneha Patel", username: "sneha_p", avatar: "https://i.pravatar.cc/150?u=70", rqs: 89, verified: true, category: "Beauty", product: "Rare Beauty Blush", text: "A little goes a LONG way. One dot is enough for both cheeks. The pigment is insane.", media: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=800&auto=format&fit=crop", time: "1w", agrees: 300, comments: 45, seenBy: "Rare Beauty" },
    { id: 14, name: "John Doe", username: "jdoe_90", avatar: "https://i.pravatar.cc/150?u=75", rqs: 75, verified: true, category: "Travel", product: "Airbnb (App)", text: "Hidden cleaning fees are getting out of hand. The app works fine, but the pricing transparency needs work.", media: null, time: "1w", agrees: 500, comments: 120, seenBy: "Airbnb" },
    { id: 15, name: "FitFreak", username: "gym_rat", avatar: "https://i.pravatar.cc/150?u=80", rqs: 90, verified: true, category: "Fitness", product: "Whoop 4.0", text: "Love that it has no screen. Distraction-free tracking. Recovery metrics seem more accurate than my Apple Watch.", media: "https://images.unsplash.com/photo-1576243345690-8e4b73484b82?q=80&w=800&auto=format&fit=crop", time: "1w", agrees: 110, comments: 15, seenBy: null },
    { id: 16, name: "Zara Ali", username: "zara_designs", avatar: "https://i.pravatar.cc/150?u=85", rqs: 84, verified: true, category: "Design", product: "Figma", text: "Dev mode is a paid feature now? Disappointing move, but the tool is still indispensable for UI design.", media: null, time: "1w", agrees: 220, comments: 60, seenBy: "Figma" },
    { id: 17, name: "Mike Ross", username: "mross_law", avatar: "https://i.pravatar.cc/150?u=90", rqs: 87, verified: true, category: "Books", product: "Kindle Paperwhite", text: "Warm light adjustment is the best feature. Reads just like paper. Battery lasts weeks.", media: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop", time: "2w", agrees: 180, comments: 25, seenBy: "Amazon" },
    { id: 18, name: "Lisa Wong", username: "lisa_w", avatar: "https://i.pravatar.cc/150?u=95", rqs: 83, verified: false, category: "Food", product: "Chipotle", text: "Portion sizes have definitely shrunk. The flavor is there, but I shouldn't have to ask for double rice to get full.", media: null, time: "2w", agrees: 400, comments: 90, seenBy: null },
    { id: 19, name: "Tom Holland", username: "not_spiderman", avatar: "https://i.pravatar.cc/150?u=99", rqs: 93, verified: true, category: "Gaming", product: "PS5 Slim", text: "It actually fits in my media center now. Runs quiet. The detachable disc drive concept is smart.", media: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800&auto=format&fit=crop", time: "2w", agrees: 250, comments: 40, seenBy: "PlayStation" },
    { id: 20, name: "Nina K", username: "nina_k", avatar: "https://i.pravatar.cc/150?u=10", rqs: 80, verified: true, category: "Lifestyle", product: "Stanley Quencher", text: "It spills if you tip it over! I don't get the hype. It keeps water cold, sure, but so does a $10 bottle.", media: "https://images.unsplash.com/photo-1602143407151-011141950038?q=80&w=800&auto=format&fit=crop", time: "2w", agrees: 600, comments: 150, seenBy: "Stanley" },
    { id: 21, name: "Carlos M", username: "carlos_m", avatar: "https://i.pravatar.cc/150?u=15", rqs: 88, verified: true, category: "Auto", product: "Tesla Model Y", text: "FSD Beta v12 is smoother, but still phantom brakes occasionally. The car itself is the best daily driver I've owned.", media: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800&auto=format&fit=crop", time: "3w", agrees: 140, comments: 35, seenBy: "Tesla" },
    { id: 22, name: "DevOps Dan", username: "dan_ops", avatar: "https://i.pravatar.cc/150?u=20", rqs: 96, verified: true, category: "Tech", product: "MacBook Pro M3", text: "Space Black is a fingerprint magnet, beware. Performance is overkill for web dev, but I love it.", media: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=800&auto=format&fit=crop", time: "3w", agrees: 190, comments: 22, seenBy: "Apple" },
    { id: 23, name: "CoffeeSnob", username: "bean_machine", avatar: "https://i.pravatar.cc/150?u=25", rqs: 91, verified: true, category: "Home", product: "Nespresso Vertuo", text: "Convenient, but the pods are expensive and proprietary. The crema is artificial foam, not real espresso crema.", media: null, time: "3w", agrees: 75, comments: 10, seenBy: "Nespresso" },
    { id: 24, name: "Yoga Jen", username: "jen_flow", avatar: "https://i.pravatar.cc/150?u=35", rqs: 85, verified: true, category: "Fitness", product: "Lululemon Align", text: "Pilling is still an issue after 6 months. They are buttery soft, but I hesitate to use them for high intensity.", media: null, time: "3w", agrees: 130, comments: 25, seenBy: "Lululemon" },
    { id: 25, name: "TechCruncher", username: "tc_fan", avatar: "https://i.pravatar.cc/150?u=45", rqs: 89, verified: false, category: "Software", product: "Windows 11", text: "Copilot is annoying, I disabled it immediately. The UI rounding is nice, feels more modern than 10.", media: "https://images.unsplash.com/photo-1633419461186-7d75076e82d7?q=80&w=800&auto=format&fit=crop", time: "4w", agrees: 210, comments: 60, seenBy: "Microsoft" },
    { id: 26, name: "MusicLvr", username: "tunes_daily", avatar: "https://i.pravatar.cc/150?u=52", rqs: 92, verified: true, category: "Music", product: "Spotify", text: "Stop trying to make me listen to podcasts! I just want my music. The AI DJ is actually kind of fun though.", media: null, time: "1mo", agrees: 550, comments: 90, seenBy: "Spotify" },
    { id: 27, name: "PhotoGeek", username: "shutter_speed", avatar: "https://i.pravatar.cc/150?u=58", rqs: 94, verified: true, category: "Electronics", product: "Fujifilm X100VI", text: "Worth the wait? Maybe. The IBIS is a huge upgrade. It's the perfect everyday carry camera.", media: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop", time: "1mo", agrees: 300, comments: 50, seenBy: "Fujifilm" },
    { id: 28, name: "KpopStan", username: "bts_army", avatar: "https://i.pravatar.cc/150?u=62", rqs: 76, verified: false, category: "Music", product: "Weverse App", text: "Translations are still clunky. Notifications sometimes delayed. But it's the only way to get merch.", media: null, time: "1mo", agrees: 1500, comments: 300, seenBy: null },
    { id: 29, name: "Chef Ramsay", username: "not_gordon", avatar: "https://i.pravatar.cc/150?u=68", rqs: 82, verified: true, category: "Kitchen", product: "HexClad Pan", text: "It's not really non-stick like Teflon, but it sears well. Very durable. Overpriced unless on sale.", media: null, time: "1mo", agrees: 90, comments: 15, seenBy: "HexClad" },
    { id: 30, name: "UrbanExplorer", username: "city_walk", avatar: "https://i.pravatar.cc/150?u=72", rqs: 88, verified: true, category: "Apparel", product: "Uniqlo Airism", text: "The oversized tee fit is perfect. Breathable in 40 degree heat. Best basic t-shirt on the market.", media: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop", time: "1mo", agrees: 200, comments: 20, seenBy: "Uniqlo" },
    { id: 31, name: "TravelBug", username: "fly_away", avatar: "https://i.pravatar.cc/150?u=78", rqs: 90, verified: true, category: "Travel", product: "Away Luggage", text: "The battery pack is removable which is key for checking bags. Wheels glide over everything. Scuffs easily though.", media: "https://images.unsplash.com/photo-1565538004-b6574c8b9829?q=80&w=800&auto=format&fit=crop", time: "2mo", agrees: 115, comments: 18, seenBy: "Away" },
    { id: 32, name: "CodeNinja", username: "py_dev", avatar: "https://i.pravatar.cc/150?u=82", rqs: 95, verified: true, category: "Tech", product: "Raspberry Pi 5", text: "Finally fast enough for a decent desktop experience. PCIe connector opens up so many possibilities.", media: null, time: "2mo", agrees: 330, comments: 40, seenBy: "Raspberry Pi" },
    { id: 33, name: "SkaterBoi", username: "kick_flip", avatar: "https://i.pravatar.cc/150?u=88", rqs: 81, verified: true, category: "Sport", product: "Vans Old Skool", text: "Classic look, zero arch support. My feet hurt after an hour, but they look cool.", media: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop", time: "2mo", agrees: 400, comments: 30, seenBy: "Vans" },
    { id: 34, name: "EcoWarrior", username: "green_life", avatar: "https://i.pravatar.cc/150?u=92", rqs: 86, verified: true, category: "Home", product: "SodaStream", text: "Saved so many plastic bottles. CO2 exchange is easy at Target. Wish the bottles were dishwasher safe.", media: null, time: "2mo", agrees: 150, comments: 20, seenBy: "SodaStream" },
    { id: 35, name: "BookWorm", username: "read_it", avatar: "https://i.pravatar.cc/150?u=96", rqs: 93, verified: false, category: "Books", product: "Audible", text: "Subscription model is pricey, but the production quality of originals is getting better. 'Project Hail Mary' is a must-listen.", media: null, time: "2mo", agrees: 220, comments: 45, seenBy: "Audible" },
    { id: 36, name: "GymBro", username: "lift_heavy", avatar: "https://i.pravatar.cc/150?u=5", rqs: 78, verified: true, category: "Supplement", product: "Creatine Monohydrate", text: "Just get the cheap unflavored stuff. It's all the same. Mixes poorly but gains are real.", media: null, time: "3mo", agrees: 500, comments: 60, seenBy: null },
    { id: 37, name: "AppleFan", username: "cupertino_s", avatar: "https://i.pravatar.cc/150?u=11", rqs: 90, verified: true, category: "Electronics", product: "Vision Pro", text: "The tech is mind-blowing. The weight is neck-breaking. It's a dev kit sold as a consumer product.", media: "https://images.unsplash.com/photo-1707589947963-c288960d7c3d?q=80&w=800&auto=format&fit=crop", time: "3mo", agrees: 1000, comments: 300, seenBy: "Apple" },
    { id: 38, name: "PetLover", username: "dog_mom", avatar: "https://i.pravatar.cc/150?u=18", rqs: 84, verified: true, category: "Pets", product: "Chewy.com", text: "Customer service is unmatched. They sent me flowers when my dog passed away. Loyal customer for life.", media: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop", time: "3mo", agrees: 800, comments: 100, seenBy: "Chewy" },
    { id: 39, name: "StreamerGirl", username: "live_now", avatar: "https://i.pravatar.cc/150?u=28", rqs: 89, verified: true, category: "Tech", product: "Elgato Stream Deck", text: "Not just for streamers. I use it for productivity macros, Zoom mute, and Spotify control. Essential desk accessory.", media: null, time: "3mo", agrees: 210, comments: 25, seenBy: "Elgato" },
    { id: 40, name: "FinanceBro", username: "stonks_up", avatar: "https://i.pravatar.cc/150?u=38", rqs: 77, verified: true, category: "Finance", product: "Robinhood", text: "Charts are too simple for real analysis. Good for beginners, but moving to WeBull for better data.", media: null, time: "4mo", agrees: 150, comments: 40, seenBy: "Robinhood" },
    { id: 41, name: "CoffeeAddict", username: "latte_art", avatar: "https://i.pravatar.cc/150?u=48", rqs: 92, verified: true, category: "Food", product: "Oatly Barista", text: "Froths better than any other oat milk. Tastes neutral, doesn't overpower the coffee beans.", media: null, time: "4mo", agrees: 300, comments: 35, seenBy: "Oatly" },
    { id: 42, name: "RunnerGuy", username: "marathon_m", avatar: "https://i.pravatar.cc/150?u=54", rqs: 88, verified: true, category: "Fitness", product: "Hoka Clifton 9", text: "Like running on clouds. Maybe too squishy for speed work, but my knees thank me on recovery runs.", media: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=800&auto=format&fit=crop", time: "4mo", agrees: 220, comments: 18, seenBy: "Hoka" },
    { id: 43, name: "DecorDiva", username: "home_style", avatar: "https://i.pravatar.cc/150?u=64", rqs: 83, verified: true, category: "Home", product: "IKEA Billy Bookcase", text: "A classic for a reason. Easy to hack and paint. The back panel is flimsy cardboard though.", media: "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=800&auto=format&fit=crop", time: "5mo", agrees: 400, comments: 45, seenBy: "IKEA" },
    { id: 44, name: "GadgetGuy", username: "tech_reviews", avatar: "https://i.pravatar.cc/150?u=74", rqs: 91, verified: true, category: "Tech", product: "Anker 737 Power Bank", text: "Charges my laptop at full speed. The display showing input/output wattage is super nerdy and I love it.", media: null, time: "5mo", agrees: 180, comments: 12, seenBy: "Anker" },
    { id: 45, name: "StudentLife", username: "study_hard", avatar: "https://i.pravatar.cc/150?u=84", rqs: 85, verified: true, category: "Productivity", product: "Notion", text: "Steep learning curve. Once you set up your system it's amazing, but I spent more time customizing it than studying.", media: null, time: "6mo", agrees: 600, comments: 80, seenBy: "Notion" },
    { id: 46, name: "BurgerKing", username: "fast_foodie", avatar: "https://i.pravatar.cc/150?u=94", rqs: 79, verified: false, category: "Food", product: "In-N-Out", text: "Overrated? No. Best value burger in existence? Yes. The fries are bad though, order them well-done.", media: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", time: "6mo", agrees: 900, comments: 200, seenBy: null },
    { id: 47, name: "CleanFreak", username: "tidy_up", avatar: "https://i.pravatar.cc/150?u=4", rqs: 90, verified: true, category: "Home", product: "Scrub Daddy", text: "It actually works. Stays firm in cold water, soft in warm. Doesn't smell like regular sponges.", media: null, time: "6mo", agrees: 350, comments: 30, seenBy: "Scrub Daddy" },
    { id: 48, name: "PCMasterRace", username: "rgb_everything", avatar: "https://i.pravatar.cc/150?u=14", rqs: 93, verified: true, category: "Gaming", product: "NVIDIA RTX 4090", text: "Expensive as a used car, but 4K 120fps with Ray Tracing is a religious experience. Needs a massive case.", media: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop", time: "7mo", agrees: 400, comments: 100, seenBy: "NVIDIA" },
    { id: 49, name: "FlightClub", username: "av_geek", avatar: "https://i.pravatar.cc/150?u=24", rqs: 82, verified: true, category: "Travel", product: "Delta Airlines", text: "Free Wi-Fi is great. In-flight entertainment is superior to American/United. SkyMiles devaluation hurts though.", media: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop", time: "7mo", agrees: 150, comments: 25, seenBy: "Delta" },
    { id: 50, name: "RetailTherapy", username: "shop_aholic", avatar: "https://i.pravatar.cc/150?u=34", rqs: 75, verified: true, category: "Apparel", product: "Zara", text: "Cute styles, terrible sizing consistency. You have to try everything on. Returns are annoying now.", media: null, time: "8mo", agrees: 220, comments: 40, seenBy: "Zara" }
];

// LENS DATA
window.PlusOpinion.state.lens = {
  topics: [
    { id: 'foryou', label: 'For You' },
    { id: 'trending', label: 'Trending', icon: 'Trending' },
    { id: 'verified', label: 'Verified Only', icon: 'Shield' },
    { id: 'highrqs', label: 'High RQS', icon: 'Zap' },
    { id: 'new', label: 'New Today' },
    { id: 'videos', label: 'Videos' }
  ],

  searches: ["ANC Headphones", "EV Scooters", "Gaming Monitors", "Retinol Serum", "Budget 5G Phone", "Protein Powder"],

  products: [
    { id: 1, name: "Sony WH-1000XM5", brand: "Sony", rqs: 92, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=200", reviews: "2.4k" },
    { id: 2, name: "Nothing Phone (2)", brand: "Nothing", rqs: 88, image: "https://images.unsplash.com/photo-1692341995778-2940656037a5?auto=format&fit=crop&q=80&w=200", reviews: "1.1k" },
    { id: 3, name: "MacBook Air M3", brand: "Apple", rqs: 95, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=200", reviews: "5.8k" },
    { id: 4, name: "Fujifilm X100VI", brand: "Fujifilm", rqs: 91, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200", reviews: "3.2k" },
  ],

  reviewers: [
    { id: 1, name: "TechJunkie", handle: "@tech_j", avatar: "https://i.pravatar.cc/150?u=22", rqs: 94 },
    { id: 2, name: "Sarah E.", handle: "@sarah_e", avatar: "https://i.pravatar.cc/150?u=30", rqs: 88 },
    { id: 3, name: "David Chen", handle: "@dchen", avatar: "https://i.pravatar.cc/150?u=33", rqs: 95 },
    { id: 4, name: "GamerX", handle: "@gamer99", avatar: "https://i.pravatar.cc/150?u=12", rqs: 82 },
  ]
};

// CATEGORIES
window.PlusOpinion.state.categories = {
    DEEP_DB: {
        'tech': {
            id: 'tech', title: 'Electronics', icon: 'Cpu', count: '12k', color: '#06B6D4',
            subs: [
                { title: 'Smartphones', brands: [{name:'Apple', models:['iPhone 15 Pro Max', 'iPhone 15']}, {name:'Samsung', models:['S24 Ultra']}] },
                { title: 'Laptops', brands: [{name:'Apple', models:['MacBook Pro']}, {name:'Dell', models:['XPS 15']}] },
                { title: 'Audio', brands: [{name:'Sony', models:['WH-1000XM5']}, {name:'Bose', models:['QC Ultra']}] }
            ]
        },
        'fashion': {
            id: 'fashion', title: 'Fashion', icon: 'Shirt', count: '22k', color: '#F43F5E',
            subs: [
                { title: 'Sneakers', brands: [{name:'Nike', models:['Jordan 1']}, {name:'Adidas', models:['Samba']}] },
                { title: 'Streetwear', brands: [{name:'Supreme', models:[]}, {name:'Stussy', models:[]}] }
            ]
        },
        'food': {
            id: 'food', title: 'Food & Bev', icon: 'Coffee', count: '30k', color: '#F59E0B',
            subs: [
                { title: 'Coffee', brands: [{name:'Starbucks', models:[]}, {name:'Blue Bottle', models:[]}] },
                { title: 'Fast Food', brands: [{name:'McDonalds', models:[]}, {name:'Chipotle', models:[]}] }
            ]
        },
        'care': {
            id: 'care', title: 'Personal Care', icon: 'Heart', count: '15k', color: '#8B5CF6',
            subs: [
                { title: 'Skincare', brands: [{name:'Cerave', models:[]}, {name:'The Ordinary', models:[]}] },
                { title: 'Makeup', brands: [{name:'Rare Beauty', models:[]}] }
            ]
        },
        'auto': {
            id: 'auto', title: 'Automotive', icon: 'Car', count: '4k', color: '#10B981', trend: '+24%',
            subs: [
                { title: 'EVs', brands: [{name:'Tesla', models:['Model Y']}, {name:'Rivian', models:['R1T']}] },
                { title: 'SUVs', brands: [{name:'Toyota', models:['RAV4']}] }
            ]
        },
        'home': {
            id: 'home', title: 'Home', icon: 'Armchair', count: '8k', color: '#EC4899', trend: '+18%',
            subs: [
                { title: 'Furniture', brands: [{name:'IKEA', models:['Billy']}] },
                { title: 'Appliances', brands: [{name:'Dyson', models:['V15']}] }
            ]
        },
        'travel': {
            id: 'travel', title: 'Travel', icon: 'Plane', count: '10k', color: '#0EA5E9', trend: '+12%',
            subs: [
                { title: 'Luggage', brands: [{name:'Away', models:['Carry-On']}] },
                { title: 'Airlines', brands: [{name:'Delta', models:[]}] }
            ]
        },
        'finance': {
            id: 'finance', title: 'Finance', icon: 'Landmark', count: '2k', color: '#3B82F6',
            subs: [
                { title: 'Banking', brands: [{name:'Chase', models:[]}] },
                { title: 'Crypto', brands: [{name:'Coinbase', models:[]}] }
            ]
        },
        'edu': {
            id: 'edu', title: 'Education', icon: 'BookOpen', count: '3k', color: '#6366F1',
            subs: [
                { title: 'Online', brands: [{name:'Coursera', models:[]}] }
            ]
        },
        'office': {
            id: 'office', title: 'Office', icon: 'Briefcase', count: '1.5k', color: '#64748B',
            subs: [
                { title: 'Chairs', brands: [{name:'Herman Miller', models:['Aeron']}] }
            ]
        },
        'gaming': {
            id: 'gaming', title: 'Gaming', icon: 'Gamepad', count: '8.5k', color: '#A855F7',
            subs: [
                { title: 'Consoles', brands: [{name:'Sony', models:['PS5']}] }
            ]
        },
        'music': {
            id: 'music', title: 'Music', icon: 'Music', count: '5k', color: '#E11D48',
            subs: [
                { title: 'Streaming', brands: [{name:'Spotify', models:[]}] }
            ]
        },
        'pets': {
            id: 'pets', title: 'Pets', icon: 'Paw', count: '3.5k', color: '#D97706',
            subs: [
                { title: 'Food', brands: [{name:'Royal Canin', models:[]}] }
            ]
        },
        'photo': {
            id: 'photo', title: 'Photography', icon: 'Camera', count: '6k', color: '#3B82F6',
            subs: [
                { title: 'Mirrorless', brands: [{name:'Sony', models:['A7IV']}] }
            ]
        },
        'sports': {
            id: 'sports', title: 'Sports', icon: 'Dumbbell', count: '4.5k', color: '#EF4444',
            subs: [
                { title: 'Gym', brands: [{name:'Rogue', models:[]}] }
            ]
        },
        'outdoor': {
            id: 'outdoor', title: 'Outdoors', icon: 'Tent', count: '2.8k', color: '#22C55E',
            subs: [
                { title: 'Camping', brands: [{name:'YETI', models:[]}] }
            ]
        }
    }
};

window.PlusOpinion.state.categories.POPULAR_KEYS = ['tech', 'fashion', 'food', 'care'];
window.PlusOpinion.state.categories.GROWING_KEYS = ['auto', 'home', 'travel'];
window.PlusOpinion.state.categories.ALL_KEYS = ['finance', 'edu', 'office', 'gaming', 'music', 'pets', 'photo', 'sports', 'outdoor'];

// DRAFTS (for Opinion Composer)
window.PlusOpinion.state.drafts = [];

// USER STATE (temporary)
window.PlusOpinion.state.user = null;