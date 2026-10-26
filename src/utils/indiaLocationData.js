// India Location Directory and Address Search Utilities for PackYatra

export const CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Gurgaon",
  "Noida",
  "Kochi",
  "Indore",
  "Coimbatore",
  "Visakhapatnam",
  "Surat",
  "Nagpur",
  "Patna",
  "Bhopal",
  "Vadodara",
  "Bhubaneswar",
  "Guwahati",
  "Dehradun",
  "Goa",
  "Mysore",
  "Mangalore",
  "Trivandrum",
  "Ranchi"
];

// Rich localities for all major operational cities
export const CITY_LOCALITIES = {
  Bangalore: [
    { name: "Indiranagar 100ft Road", pincode: "560038", landmark: "Near Metro Station", area: "Indiranagar" },
    { name: "Koramangala 4th Block", pincode: "560034", landmark: "Near Sony World Signal", area: "Koramangala" },
    { name: "Whitefield Main Road", pincode: "560066", landmark: "Near ITPL", area: "Whitefield" },
    { name: "HSR Layout Sector 1", pincode: "560102", landmark: "Near 27th Main", area: "HSR Layout" },
    { name: "HSR Layout Sector 2", pincode: "560102", landmark: "Near BDA Complex", area: "HSR Layout" },
    { name: "Electronic City Phase 1", pincode: "560100", landmark: "Near Infosys Gate 1", area: "Electronic City" },
    { name: "Jayanagar 4th Block", pincode: "560011", landmark: "Near Shopping Complex", area: "Jayanagar" },
    { name: "JP Nagar 6th Phase", pincode: "560078", landmark: "Near Central Mall", area: "JP Nagar" },
    { name: "Malleshwaram 8th Cross", pincode: "560003", landmark: "Margosa Road", area: "Malleshwaram" },
    { name: "Bellandur Outer Ring Road", pincode: "560103", landmark: "Near EcoSpace Tech Park", area: "Bellandur" },
    { name: "Marathahalli Bridge", pincode: "560037", landmark: "Near Kalamandir", area: "Marathahalli" },
    { name: "BTM Layout 2nd Stage", pincode: "560076", landmark: "Near Udupi Garden", area: "BTM Layout" },
    { name: "Sarjapur Road", pincode: "560035", landmark: "Near Wipro Corporate Office", area: "Sarjapur" },
    { name: "Bannerghatta Road", pincode: "560076", landmark: "Near Meenakshi Mall", area: "Bannerghatta" },
    { name: "Hebbal Flyover", pincode: "560024", landmark: "Near Manyata Tech Park", area: "Hebbal" },
    { name: "Yelahanka New Town", pincode: "560064", landmark: "Near Rail Wheel Factory", area: "Yelahanka" },
    { name: "Rajajinagar 1st Block", pincode: "560010", landmark: "Near Orion Mall", area: "Rajajinagar" },
    { name: "Banashankari 3rd Stage", pincode: "560085", landmark: "Near BDA Complex", area: "Banashankari" },
    { name: "Kalyan Nagar HRBR Layout", pincode: "560043", landmark: "Near Kammanahalli", area: "Kalyan Nagar" },
    { name: "Vijayanagar Club Road", pincode: "560040", landmark: "Near Metro Station", area: "Vijayanagar" },
    { name: "Domlur Layout", pincode: "560071", landmark: "Near EGL Tech Park", area: "Domlur" },
    { name: "Basavanagudi DVG Road", pincode: "560004", landmark: "Near Gandhi Bazaar", area: "Basavanagudi" },
    { name: "Varthur Gunjur Road", pincode: "560087", landmark: "Near Varthur Lake", area: "Varthur" },
    { name: "RT Nagar Post Office Road", pincode: "560032", landmark: "Near Police Station", area: "RT Nagar" },
    { name: "Sadashivnagar", pincode: "560080", landmark: "Near Sankey Tank", area: "Sadashivnagar" }
  ],
  Mumbai: [
    { name: "Bandra West Hill Road", pincode: "400050", landmark: "Near Bandra Station", area: "Bandra West" },
    { name: "Bandra Kurla Complex (BKC)", pincode: "400051", landmark: "Near MMRDA Grounds", area: "BKC" },
    { name: "Andheri West Lokhandwala Complex", pincode: "400053", landmark: "Near Infinity Mall", area: "Andheri West" },
    { name: "Andheri East MIDC", pincode: "400093", landmark: "Near Chakala Metro", area: "Andheri East" },
    { name: "Powai Hiranandani Gardens", pincode: "400076", landmark: "Near Galleria Shopping", area: "Powai" },
    { name: "Juhu Tara Road", pincode: "400049", landmark: "Near Juhu Beach", area: "Juhu" },
    { name: "Colaba Causeway", pincode: "400005", landmark: "Near Regal Cinema", area: "Colaba" },
    { name: "Dadar West Shivaji Park", pincode: "400028", landmark: "Near Sena Bhavan", area: "Dadar West" },
    { name: "Borivali West IC Colony", pincode: "400103", landmark: "Near Link Road", area: "Borivali West" },
    { name: "Malad West Mindspace", pincode: "400064", landmark: "Near Inorbit Mall", area: "Malad West" },
    { name: "Thane West Ghodbunder Road", pincode: "400607", landmark: "Near Viviana Mall", area: "Thane West" },
    { name: "Navi Mumbai Vashi Sector 17", pincode: "400703", landmark: "Near Inorbit Vashi", area: "Vashi" },
    { name: "Navi Mumbai Kharghar Sector 20", pincode: "410210", landmark: "Near Central Park", area: "Kharghar" },
    { name: "Goregaon East Gokuldham", pincode: "400063", landmark: "Near Oberoi Mall", area: "Goregaon East" },
    { name: "Worli Sea Face", pincode: "400018", landmark: "Near Bandra-Worli Sea Link", area: "Worli" },
    { name: "Lower Parel High Street Phoenix", pincode: "400013", landmark: "Near Palladium Mall", area: "Lower Parel" },
    { name: "Santacruz West Linking Road", pincode: "400054", landmark: "Near Station", area: "Santacruz" },
    { name: "Kandivali East Thakur Village", pincode: "400101", landmark: "Near D-Mart", area: "Kandivali East" },
    { name: "Chembur Diamond Garden", pincode: "400071", landmark: "Near Monorail Station", area: "Chembur" }
  ],
  "Delhi NCR": [
    { name: "Connaught Place Inner Circle", pincode: "110001", landmark: "Near Rajiv Chowk Metro", area: "Connaught Place" },
    { name: "Hauz Khas Enclave", pincode: "110016", landmark: "Near Aurobindo Market", area: "Hauz Khas" },
    { name: "South Extension Part 2", pincode: "110049", landmark: "Near Ring Road", area: "South Extension" },
    { name: "Saket District Centre", pincode: "110017", landmark: "Near Select Citywalk", area: "Saket" },
    { name: "Vasant Kunj Sector B", pincode: "110070", landmark: "Near Ambience Mall", area: "Vasant Kunj" },
    { name: "Dwarka Sector 12", pincode: "110078", landmark: "Near City Centre", area: "Dwarka" },
    { name: "Rohini Sector 9", pincode: "110085", landmark: "Near Ring Road Mall", area: "Rohini" },
    { name: "Greater Kailash 1 M Block", pincode: "110048", landmark: "Near M-Block Market", area: "Greater Kailash" },
    { name: "Lajpat Nagar 2 Central Market", pincode: "110024", landmark: "Near Metro", area: "Lajpat Nagar" },
    { name: "Karol Bagh Arya Samaj Road", pincode: "110005", landmark: "Near Gaffar Market", area: "Karol Bagh" },
    { name: "Pitampura Netaji Subhash Place", pincode: "110034", landmark: "Near Metro Station", area: "Pitampura" },
    { name: "Mayur Vihar Phase 1", pincode: "110091", landmark: "Near Metro Station", area: "Mayur Vihar" },
    { name: "Janakpuri District Centre", pincode: "110058", landmark: "Near West Delhi Mall", area: "Janakpuri" },
    { name: "Punjabi Bagh Club Road", pincode: "110026", landmark: "Near Central Market", area: "Punjabi Bagh" }
  ],
  Gurgaon: [
    { name: "Cyber City DLF Phase 2", pincode: "122002", landmark: "Near Rapid Metro", area: "Cyber City" },
    { name: "Golf Course Road Sector 54", pincode: "122011", landmark: "Near Horizon Center", area: "Golf Course Road" },
    { name: "DLF Phase 1 Golf Course", pincode: "122002", landmark: "Near Silver Oaks", area: "DLF Phase 1" },
    { name: "Sohna Road Sector 48", pincode: "122018", landmark: "Near Vipul Tech Square", area: "Sohna Road" },
    { name: "Sector 29 Leisure Valley", pincode: "122001", landmark: "Near Kingdom of Dreams", area: "Sector 29" },
    { name: "Sector 56 Metro Station", pincode: "122011", landmark: "Near Huda Market", area: "Sector 56" },
    { name: "Sector 82 Vatika City", pincode: "122004", landmark: "Near NH-48", area: "Sector 82" },
    { name: "Sushant Lok 1 C Block", pincode: "122009", landmark: "Near Courtyard Marriott", area: "Sushant Lok" }
  ],
  Noida: [
    { name: "Sector 18 Atta Market", pincode: "201301", landmark: "Near Wave Mall", area: "Sector 18" },
    { name: "Sector 62 Electronic City", pincode: "201309", landmark: "Near Metro Station", area: "Sector 62" },
    { name: "Sector 137 Paras Tierea", pincode: "201305", landmark: "Near Expressway", area: "Sector 137" },
    { name: "Sector 50 Central Park", pincode: "201301", landmark: "Near Market", area: "Sector 50" },
    { name: "Sector 76 Amrapali Silicon", pincode: "201301", landmark: "Near Metro", area: "Sector 76" },
    { name: "Sector 150 Sports City", pincode: "201310", landmark: "Near Expressway", area: "Sector 150" },
    { name: "Noida Extension Gaur City 1", pincode: "201009", landmark: "Near Gaur City Mall", area: "Greater Noida West" }
  ],
  Hyderabad: [
    { name: "Hitec City Cyber Towers", pincode: "500081", landmark: "Near Shilparamam", area: "Hitec City" },
    { name: "Gachibowli Financial District", pincode: "500032", landmark: "Near WaveRock SEZ", area: "Gachibowli" },
    { name: "Jubilee Hills Road No. 36", pincode: "500033", landmark: "Near Peddamma Temple", area: "Jubilee Hills" },
    { name: "Banjara Hills Road No. 12", pincode: "500034", landmark: "Near GVK One Mall", area: "Banjara Hills" },
    { name: "Madhapur Ayyappa Society", pincode: "500081", landmark: "Near Durgam Cheruvu", area: "Madhapur" },
    { name: "Kondapur Botanical Garden Road", pincode: "500084", landmark: "Near Sarath City Mall", area: "Kondapur" },
    { name: "Kukatpally KPHB Colony", pincode: "500072", landmark: "Near Forum Sujana Mall", area: "Kukatpally" },
    { name: "Secunderabad Clock Tower", pincode: "500003", landmark: "Near Railway Station", area: "Secunderabad" },
    { name: "Begumpet Prakash Nagar", pincode: "500016", landmark: "Near Lifestyle Mall", area: "Begumpet" },
    { name: "Manikonda Puppalguda", pincode: "500089", landmark: "Near Lanco Hills", area: "Manikonda" },
    { name: "Miyapur Allwyn Colony", pincode: "500049", landmark: "Near Metro Terminal", area: "Miyapur" }
  ],
  Chennai: [
    { name: "Adyar Sardar Patel Road", pincode: "600020", landmark: "Near Adyar Signal", area: "Adyar" },
    { name: "Anna Nagar 2nd Avenue", pincode: "600040", landmark: "Near Roundtana", area: "Anna Nagar" },
    { name: "T. Nagar Pondy Bazaar", pincode: "600017", landmark: "Near Panagal Park", area: "T. Nagar" },
    { name: "Velachery 100 Feet Bypass Road", pincode: "600042", landmark: "Near Phoenix Marketcity", area: "Velachery" },
    { name: "OMR Thoraipakkam", pincode: "600097", landmark: "Near AKDR Golf Village", area: "OMR" },
    { name: "OMR Sholinganallur Junction", pincode: "600119", landmark: "Near ELCOT SEZ", area: "Sholinganallur" },
    { name: "Thiruvanmiyur ECR Road", pincode: "600041", landmark: "Near Marundeeswarar Temple", area: "Thiruvanmiyur" },
    { name: "Mylapore Luz Corner", pincode: "600004", landmark: "Near Kapaleeshwarar Temple", area: "Mylapore" },
    { name: "Nungambakkam High Road", pincode: "600034", landmark: "Near Taj Coromandel", area: "Nungambakkam" },
    { name: "Porur Arcot Road", pincode: "600116", landmark: "Near Ramachandra Hospital", area: "Porur" },
    { name: "Guindy Kathipara Junction", pincode: "600032", landmark: "Near Olympia Tech Park", area: "Guindy" }
  ],
  Pune: [
    { name: "Kothrud Paud Road", pincode: "411038", landmark: "Near Vanaz Metro Station", area: "Kothrud" },
    { name: "Hinjewadi Phase 1", pincode: "411057", landmark: "Near Rajiv Gandhi Infotech Park", area: "Hinjewadi" },
    { name: "Hinjewadi Phase 2 Wipro Circle", pincode: "411057", landmark: "Near Quadron Business Park", area: "Hinjewadi" },
    { name: "Viman Nagar Central Avenue", pincode: "411014", landmark: "Near Phoenix Marketcity", area: "Viman Nagar" },
    { name: "Koregaon Park North Main Road", pincode: "411001", landmark: "Near Osho Ashram", area: "Koregaon Park" },
    { name: "Baner Balewadi High Street", pincode: "411045", landmark: "Near Pancard Club Road", area: "Baner" },
    { name: "Wakad Dange Chowk", pincode: "411057", landmark: "Near Mumbai-Pune Expressway", area: "Wakad" },
    { name: "Aundh ITI Road", pincode: "411007", landmark: "Near Westend Mall", area: "Aundh" },
    { name: "Magarpatta City Cybercity", pincode: "411028", landmark: "Near Seasons Mall", area: "Hadapsar" },
    { name: "Kalyani Nagar Bishop School Road", pincode: "411006", landmark: "Near Cerebrum IT Park", area: "Kalyani Nagar" },
    { name: "Kharadi EON Free Zone", pincode: "411014", landmark: "Near World Trade Center", area: "Kharadi" },
    { name: "Pimple Saudagar Kunal Icon Road", pincode: "411027", landmark: "Near Govind Garden", area: "Pimple Saudagar" }
  ],
  Kolkata: [
    { name: "Salt Lake Sector 5", pincode: "700091", landmark: "Near RDB Boulevard IT Park", area: "Salt Lake" },
    { name: "New Town Action Area 1", pincode: "700156", landmark: "Near Biswa Bangla Gate", area: "New Town" },
    { name: "Park Street", pincode: "700016", landmark: "Near Flurys & Metro", area: "Park Street" },
    { name: "Ballygunge Circular Road", pincode: "700019", landmark: "Near Birla Temple", area: "Ballygunge" },
    { name: "Alipore Burdwan Road", pincode: "700027", landmark: "Near Zoo Garden", area: "Alipore" },
    { name: "Gariahat Crossing", pincode: "700029", landmark: "Near Pantaloons", area: "Gariahat" },
    { name: "Howrah Station Road", pincode: "711101", landmark: "Near Howrah Bridge", area: "Howrah" },
    { name: "Behala Chowrasta", pincode: "700034", landmark: "Near Diamond Harbour Road", area: "Behala" }
  ],
  Ahmedabad: [
    { name: "SG Highway Bodakdev", pincode: "380054", landmark: "Near ISKCON Temple", area: "Bodakdev" },
    { name: "Satellite Ramdevnagar", pincode: "380015", landmark: "Near Star Bazaar", area: "Satellite" },
    { name: "Vastrapur Lake Road", pincode: "380015", landmark: "Near Ahmedabad One Mall", area: "Vastrapur" },
    { name: "Prahlad Nagar Corporate Road", pincode: "380015", landmark: "Near Garden", area: "Prahlad Nagar" },
    { name: "Navrangpura CG Road", pincode: "380009", landmark: "Near Municipal Market", area: "Navrangpura" },
    { name: "Bopal South Bopal Road", pincode: "380058", landmark: "Near Ring Road", area: "Bopal" }
  ],
  Jaipur: [
    { name: "Malviya Nagar Sector 3", pincode: "302017", landmark: "Near World Trade Park", area: "Malviya Nagar" },
    { name: "Vaishali Nagar Amrapali Circle", pincode: "302021", landmark: "Near National Handloom", area: "Vaishali Nagar" },
    { name: "C-Scheme Ashok Nagar", pincode: "302001", landmark: "Near Statue Circle", area: "C-Scheme" },
    { name: "Mansarovar Sector 12", pincode: "302020", landmark: "Near Metro Station", area: "Mansarovar" },
    { name: "Raja Park Tilak Nagar", pincode: "302004", landmark: "Near LBS College", area: "Raja Park" }
  ],
  Lucknow: [
    { name: "Gomti Nagar Vibhuti Khand", pincode: "226010", landmark: "Near Wave Mall", area: "Gomti Nagar" },
    { name: "Hazratganj MG Marg", pincode: "226001", landmark: "Near GPO", area: "Hazratganj" },
    { name: "Aliganj Sector B", pincode: "226024", landmark: "Near Kapoorthala", area: "Aliganj" },
    { name: "Indira Nagar Sector 14", pincode: "226016", landmark: "Near Munshipulia Metro", area: "Indira Nagar" }
  ],
  Chandigarh: [
    { name: "Sector 17 Plaza", pincode: "160017", landmark: "City Centre", area: "Sector 17" },
    { name: "Sector 35 C Market", pincode: "160035", landmark: "Near Hotel JW Marriott", area: "Sector 35" },
    { name: "Sector 8 Inner Market", pincode: "160009", landmark: "Near Madhya Marg", area: "Sector 8" },
    { name: "IT Park Phase 2", pincode: "160101", landmark: "Near DLF Cyber City", area: "IT Park" }
  ]
};

// All-India Destination hubs indexed for fast nationwide delivery search
export const ALL_INDIA_DESTINATIONS = [
  // Maharashtra
  { city: "Mumbai", state: "Maharashtra", region: "West India", tier: 1, popularAreas: ["Bandra", "Andheri", "Powai", "Worli", "Thane", "Navi Mumbai"] },
  { city: "Pune", state: "Maharashtra", region: "West India", tier: 1, popularAreas: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner", "Wakad"] },
  { city: "Nagpur", state: "Maharashtra", region: "West India", tier: 2, popularAreas: ["Dharampeth", "Civil Lines", "Wardha Road", "Manish Nagar"] },
  { city: "Nashik", state: "Maharashtra", region: "West India", tier: 2, popularAreas: ["Gangapur Road", "College Road", "Indira Nagar", "CIDCO"] },
  { city: "Aurangabad (Chhatrapati Sambhajinagar)", state: "Maharashtra", region: "West India", tier: 2, popularAreas: ["CIDCO", "Garkheda", "Cantonment"] },

  // Karnataka
  { city: "Bangalore", state: "Karnataka", region: "South India", tier: 1, popularAreas: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City"] },
  { city: "Mysore", state: "Karnataka", region: "South India", tier: 2, popularAreas: ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Vijayanagar"] },
  { city: "Mangalore", state: "Karnataka", region: "South India", tier: 2, popularAreas: ["Kadri", "Kankanady", "Bejai", "Mannagudda"] },
  { city: "Hubli-Dharwad", state: "Karnataka", region: "South India", tier: 2, popularAreas: ["Vidyanagar", "Gokul Road", "Keshwapur"] },
  { city: "Belgaum", state: "Karnataka", region: "South India", tier: 2, popularAreas: ["Tilakwadi", "Camp", "Udyambag"] },

  // Delhi NCR & North India
  { city: "Delhi", state: "Delhi NCR", region: "North India", tier: 1, popularAreas: ["Connaught Place", "South Extension", "Dwarka", "Saket", "Rohini"] },
  { city: "Gurgaon", state: "Haryana", region: "North India", tier: 1, popularAreas: ["Cyber City", "Golf Course Road", "Sohna Road", "DLF Phase 1-5"] },
  { city: "Noida", state: "Uttar Pradesh", region: "North India", tier: 1, popularAreas: ["Sector 18", "Sector 62", "Sector 137", "Noida Extension"] },
  { city: "Chandigarh", state: "Chandigarh UT", region: "North India", tier: 1, popularAreas: ["Sector 17", "Sector 35", "Sector 8", "IT Park"] },
  { city: "Jaipur", state: "Rajasthan", region: "North India", tier: 1, popularAreas: ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar"] },
  { city: "Lucknow", state: "Uttar Pradesh", region: "North India", tier: 1, popularAreas: ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar"] },
  { city: "Kanpur", state: "Uttar Pradesh", region: "North India", tier: 2, popularAreas: ["Civil Lines", "Swaroop Nagar", "Kakadeo", "Kidwai Nagar"] },
  { city: "Agra", state: "Uttar Pradesh", region: "North India", tier: 2, popularAreas: ["Tajganj", "Fatehabad Road", "Sanjay Place", "Kamla Nagar"] },
  { city: "Varanasi", state: "Uttar Pradesh", region: "North India", tier: 2, popularAreas: ["Sigra", "Lanka", "Cantonment", "Bhelupur"] },
  { city: "Dehradun", state: "Uttarakhand", region: "North India", tier: 2, popularAreas: ["Rajpur Road", "Sahastradhara Road", "Vasant Vihar"] },
  { city: "Amritsar", state: "Punjab", region: "North India", tier: 2, popularAreas: ["Ranjit Avenue", "Mall Road", "Lawrence Road"] },
  { city: "Ludhiana", state: "Punjab", region: "North India", tier: 2, popularAreas: ["Sarabha Nagar", "Model Town", "Civil Lines"] },
  { city: "Jodhpur", state: "Rajasthan", region: "North India", tier: 2, popularAreas: ["Ratanada", "Shastri Nagar", "Paota"] },
  { city: "Udaipur", state: "Rajasthan", region: "North India", tier: 2, popularAreas: ["Fatehpura", "Hiran Magri", "Panchwati"] },

  // Telangana & Andhra Pradesh
  { city: "Hyderabad", state: "Telangana", region: "South India", tier: 1, popularAreas: ["Hitec City", "Gachibowli", "Jubilee Hills", "Banjara Hills", "Kukatpally"] },
  { city: "Visakhapatnam", state: "Andhra Pradesh", region: "South India", tier: 2, popularAreas: ["MVP Colony", "Siripuram", "Madhurawada", "Gajuwaka"] },
  { city: "Vijayawada", state: "Andhra Pradesh", region: "South India", tier: 2, popularAreas: ["Benz Circle", "MG Road", "Gollapudi"] },
  { city: "Warangal", state: "Telangana", region: "South India", tier: 3, popularAreas: ["Hanamkonda", "Kazipet", "Subedari"] },

  // Tamil Nadu & Kerala
  { city: "Chennai", state: "Tamil Nadu", region: "South India", tier: 1, popularAreas: ["Adyar", "Anna Nagar", "T. Nagar", "OMR", "Velachery"] },
  { city: "Coimbatore", state: "Tamil Nadu", region: "South India", tier: 2, popularAreas: ["RS Puram", "Gandhipuram", "Peelamedu", "Saibaba Colony"] },
  { city: "Madurai", state: "Tamil Nadu", region: "South India", tier: 2, popularAreas: ["KK Nagar", "Anna Nagar", "Simmakkal"] },
  { city: "Kochi", state: "Kerala", region: "South India", tier: 1, popularAreas: ["Kakkanad (Infopark)", "Edappally", "Panampilly Nagar", "Marine Drive"] },
  { city: "Trivandrum", state: "Kerala", region: "South India", tier: 2, popularAreas: ["Technopark", "Kowdiar", "Pattom", "Vazhuthacaud"] },
  { city: "Kozhikode (Calicut)", state: "Kerala", region: "South India", tier: 2, popularAreas: ["Mavoor Road", "Beach Road", "Kallai"] },

  // Eastern & Central India
  { city: "Kolkata", state: "West Bengal", region: "East India", tier: 1, popularAreas: ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Alipore"] },
  { city: "Patna", state: "Bihar", region: "East India", tier: 2, popularAreas: ["Boring Road", "Kankarbagh", "Bailey Road", "Patliputra Colony"] },
  { city: "Bhubaneswar", state: "Odisha", region: "East India", tier: 2, popularAreas: ["Saheed Nagar", "Patia (Infocity)", "Jayadev Vihar", "Nayapalli"] },
  { city: "Ranchi", state: "Jharkhand", region: "East India", tier: 2, popularAreas: ["Harmu Housing Colony", "Kanke Road", "Doranda", "Bariatu"] },
  { city: "Guwahati", state: "Assam", region: "Northeast India", tier: 2, popularAreas: ["GS Road", "Zoo Road", "Beltola", "Dispur"] },
  { city: "Bhopal", state: "Madhya Pradesh", region: "Central India", tier: 2, popularAreas: ["Arera Colony", "MP Nagar", "Kolar Road", "Hoshangabad Road"] },
  { city: "Indore", state: "Madhya Pradesh", region: "Central India", tier: 1, popularAreas: ["Vijay Nagar", "Palasia", "AB Road", "Super Corridor"] },
  { city: "Raipur", state: "Chhattisgarh", region: "Central India", tier: 2, popularAreas: ["Shankar Nagar", "Devendra Nagar", "Telibandha"] },

  // Gujarat & Goa
  { city: "Ahmedabad", state: "Gujarat", region: "West India", tier: 1, popularAreas: ["Bodakdev", "Satellite", "SG Highway", "Vastrapur", "Prahlad Nagar"] },
  { city: "Surat", state: "Gujarat", region: "West India", tier: 1, popularAreas: ["Vesu", "Adajan", "Ghod Dod Road", "Piplod"] },
  { city: "Vadodara", state: "Gujarat", region: "West India", tier: 2, popularAreas: ["Alkapuri", "Gotri", "Vasna Road", "Karelibaug"] },
  { city: "Rajkot", state: "Gujarat", region: "West India", tier: 2, popularAreas: ["Kalawad Road", "Yagnik Road", "University Road"] },
  { city: "Goa (North/South)", state: "Goa", region: "West India", tier: 2, popularAreas: ["Panaji", "Porvorim", "Margao", "Candolim", "Mapusa"] }
];

// Matrix of inter-city road distances in KM for realistic rate computation
export const INTER_CITY_DISTANCES = {
  Bangalore: {
    Mumbai: 980,
    "Delhi NCR": 2150,
    Delhi: 2150,
    Hyderabad: 570,
    Chennai: 350,
    Pune: 840,
    Kolkata: 1870,
    Ahmedabad: 1480,
    Jaipur: 2020,
    Lucknow: 1890,
    Chandigarh: 2390,
    Gurgaon: 2120,
    Noida: 2140,
    Kochi: 540,
    Indore: 1320,
    Coimbatore: 360,
    Visakhapatnam: 1010,
    Goa: 560,
    Mysore: 145,
    Mangalore: 350
  },
  Mumbai: {
    Bangalore: 980,
    "Delhi NCR": 1420,
    Delhi: 1420,
    Hyderabad: 710,
    Chennai: 1330,
    Pune: 150,
    Kolkata: 1960,
    Ahmedabad: 530,
    Jaipur: 1150,
    Lucknow: 1380,
    Chandigarh: 1640,
    Gurgaon: 1390,
    Noida: 1410,
    Kochi: 1380,
    Indore: 590,
    Goa: 590,
    Surat: 280,
    Vadodara: 410,
    Nagpur: 810
  },
  "Delhi NCR": {
    Bangalore: 2150,
    Mumbai: 1420,
    Hyderabad: 1580,
    Chennai: 2180,
    Pune: 1440,
    Kolkata: 1530,
    Ahmedabad: 940,
    Jaipur: 280,
    Lucknow: 550,
    Chandigarh: 250,
    Kochi: 2710,
    Indore: 850,
    Dehradun: 260,
    Patna: 1050
  },
  Hyderabad: {
    Bangalore: 570,
    Mumbai: 710,
    "Delhi NCR": 1580,
    Chennai: 630,
    Pune: 560,
    Kolkata: 1490,
    Visakhapatnam: 620,
    Vijayawada: 275
  },
  Chennai: {
    Bangalore: 350,
    Mumbai: 1330,
    Hyderabad: 630,
    Kolkata: 1670,
    Kochi: 690,
    Coimbatore: 500,
    Madurai: 460
  },
  Pune: {
    Bangalore: 840,
    Mumbai: 150,
    "Delhi NCR": 1440,
    Hyderabad: 560,
    Goa: 450,
    Ahmedabad: 660,
    Nagpur: 720
  }
};

/**
 * Searches localities strictly inside the chosen operational city
 */
export function searchWithinCity(cityName, query) {
  const normCity = cityName || "Bangalore";
  const localities = CITY_LOCALITIES[normCity] || CITY_LOCALITIES["Bangalore"] || [];
  
  if (!query || query.trim().length === 0) {
    // Return top popular localities
    return localities.slice(0, 8).map(loc => ({
      title: `${loc.name}, ${normCity}`,
      area: loc.area,
      city: normCity,
      landmark: loc.landmark,
      pincode: loc.pincode,
      formatted: `${loc.name}, ${normCity} - ${loc.pincode}`,
      isWithinCity: true
    }));
  }

  const q = query.toLowerCase().trim();
  const matched = localities.filter(loc => 
    loc.name.toLowerCase().includes(q) ||
    loc.area.toLowerCase().includes(q) ||
    (loc.landmark && loc.landmark.toLowerCase().includes(q)) ||
    (loc.pincode && loc.pincode.includes(q))
  );

  return matched.map(loc => ({
    title: `${loc.name}, ${normCity}`,
    area: loc.area,
    city: normCity,
    landmark: loc.landmark,
    pincode: loc.pincode,
    formatted: `${loc.name}, ${normCity} - ${loc.pincode}`,
    isWithinCity: true
  }));
}

/**
 * Searches locations across all of India (all cities, regions, states, and localities)
 */
export function searchBetweenCities(query, originCity = "") {
  if (!query || query.trim().length === 0) {
    // Return major popular destination hubs across India excluding origin city
    return ALL_INDIA_DESTINATIONS
      .filter(dest => dest.city.toLowerCase() !== (originCity || "").toLowerCase())
      .slice(0, 10)
      .map(dest => ({
        title: `${dest.city}, ${dest.state}`,
        city: dest.city,
        state: dest.state,
        region: dest.region,
        formatted: `${dest.popularAreas[0] || "City Center"}, ${dest.city}, ${dest.state}`,
        popularAreas: dest.popularAreas,
        isBetweenCities: true
      }));
  }

  const q = query.toLowerCase().trim();
  const results = [];

  // 1. Search destination hubs by city, state, or popular areas
  for (const dest of ALL_INDIA_DESTINATIONS) {
    const cityMatch = dest.city.toLowerCase().includes(q);
    const stateMatch = dest.state.toLowerCase().includes(q);
    const matchedArea = dest.popularAreas.find(a => a.toLowerCase().includes(q));

    if (cityMatch || stateMatch || matchedArea) {
      const areaName = matchedArea || dest.popularAreas[0] || "Main City";
      results.push({
        title: `${dest.city}, ${dest.state}`,
        city: dest.city,
        state: dest.state,
        region: dest.region,
        area: areaName,
        formatted: `${areaName}, ${dest.city}, ${dest.state}`,
        popularAreas: dest.popularAreas,
        isBetweenCities: true
      });
    }
  }

  // 2. Also search detailed localities in all cities
  for (const [cityKey, locs] of Object.entries(CITY_LOCALITIES)) {
    const matchedLocs = locs.filter(l => 
      l.name.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q) ||
      (l.pincode && l.pincode.includes(q))
    );

    for (const loc of matchedLocs.slice(0, 3)) {
      results.push({
        title: `${loc.name}, ${cityKey}`,
        city: cityKey,
        area: loc.area,
        pincode: loc.pincode,
        landmark: loc.landmark,
        formatted: `${loc.name}, ${cityKey} - ${loc.pincode}`,
        isBetweenCities: true
      });
    }
  }

  // Deduplicate by formatted
  const seen = new Set();
  return results.filter(item => {
    if (seen.has(item.formatted)) return false;
    seen.add(item.formatted);
    return true;
  }).slice(0, 12);
}

/**
 * Calculates or estimates realistic inter-city highway distance in KM
 */
export function estimateInterCityDistance(originCity = "Bangalore", destAddressOrCity = "") {
  if (!destAddressOrCity) return 500;

  const destStr = destAddressOrCity.toLowerCase();
  const originNorm = Object.keys(INTER_CITY_DISTANCES).find(
    c => c.toLowerCase() === originCity.toLowerCase()
  ) || "Bangalore";

  const matrix = INTER_CITY_DISTANCES[originNorm];
  if (matrix) {
    for (const [targetCity, dist] of Object.entries(matrix)) {
      if (destStr.includes(targetCity.toLowerCase())) {
        return dist;
      }
    }
  }

  // Fallback estimates based on common routes from Bangalore/Mumbai/Delhi
  if (destStr.includes("mumbai") || destStr.includes("maharashtra")) return 980;
  if (destStr.includes("pune")) return 840;
  if (destStr.includes("hyderabad") || destStr.includes("telangana")) return 570;
  if (destStr.includes("chennai") || destStr.includes("tamil nadu")) return 350;
  if (destStr.includes("delhi") || destStr.includes("noida") || destStr.includes("gurgaon")) return 2150;
  if (destStr.includes("kolkata") || destStr.includes("west bengal")) return 1870;
  if (destStr.includes("ahmedabad") || destStr.includes("gujarat")) return 1480;
  if (destStr.includes("jaipur") || destStr.includes("rajasthan")) return 2020;
  if (destStr.includes("lucknow") || destStr.includes("uttar pradesh")) return 1890;
  if (destStr.includes("kochi") || destStr.includes("kerala")) return 540;
  if (destStr.includes("goa")) return 560;

  return 650; // Standard inter-city baseline
}
