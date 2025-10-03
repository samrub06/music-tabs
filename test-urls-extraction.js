const cheerio = require('cheerio');

// Vos cookies de test
const testCookies = '_ug_unified_id=1.1759219702.495111842; ugapp%3AtopBannerShow%3ABTS2025_viewed=1759219702907; first_visit_key=2; _pbjs_userid_consent_data=3524755945110770; _ug_landing_visited=1; _ug_visitor=1687632604263886512; _gcl_au=1.1.1142981693.1759219709; _ga=GA1.1.17917952.1759219709; _ug_coldStartCompleteOnboarding=1; bbuserid=2489635; bbusername=bonobobig; bbpassword=a9974a5de2897aef9bdec88f93291312; bbregistertype=auth; _ug_comebackOfferModalViewed=1; _ug_ex_pro_offer_timer_end=1759306128795; _ug_ex_pro_offer_promo_viewed_time=1759219728808; uid2_identity={%22advertising_token%22:%22A4AAABmRHNYj5mtCh-6vWvXAmnCOt1Wcjt4s8I7zGllsB4DJkj2OEQYNEOBSSliNsvD64AE-Rr86OmvdgB2tDV3ythDmxgEJHYvHqL4muZ6o4WNGM9Df47oeQV3VAZ1tpP3B4HUTtCphBC_Yo1NNkSSWO-u8qxg2khDP3Q_LBumFaOfeEZryMJTAamRfHLhoSAuXgxl7hPY6CaGmqmr0x-w4Rg%22%2C%22refresh_token%22:%22AAAAGZLlD+yDnDpelRA+pUJL6f/vy0KTVdisoPy8+tR7jf9smXVs3ml/QNFftVre4NVw6YYSxVws7C6I//Sa537KbGDDpAfintKmRP8Pnw7tL5lmbhBSXR7edxFTIcno2kJEyDpiFCSaMUpl9VA3M1GfVby2krDIYVp3GM/lIozKMpSzxxWF7eUX9NRNI13BVMi8vCzR7MeYNq1X8dm0IWTBP8tdrIRdfkkBuaMqyxvuPYxVFnqvYRjM6r+P6OtVwcVYoE/K/0lR25sPG0FRjXzKq6MwoQjClj0BHmYzds3wdEDc9VR9jFmT5VkfE2uUL2quuzwTUryeQb2uywOoOz2ZDYvfnazfBGf4pkPZf3Vs8YYcRHf05O6CPAU8NaAY+EHx%22%2C%22identity_expires%22:1759478933019%2C%22refresh_expires%22:1761811733019%2C%22refresh_from%22:1759223333019%2C%22refresh_response_key%22:%22rYN1VdH/M9hzPxsV11VZZFASVoposoHoc9amLVN9meM=%22}; ug_react_recently_viewed=[%22tab:2488086%22]; _ug_Official=1; _ug_small_screen=0; __ug_v2_tab_tools_chordType=piano; _cc_id=964e99a660f54ab28dac6555cbe62e41; panoramaId=27192f4811e3a1422ab47e7d26de16d5393862bb5f615525b7f7c8897998d65d; panoramaId_expiry=1759830558944; panoramaIdType=panoIndiv; _ug_playerSideShowsPerDay=4; _ug_ex_pro_offer_key=true; localization=en; static_cache_key_v2=_ver1759426476; connectId={"ttl":86400000,"lastUsed":1759428771397,"lastSynced":1759428771397}; _pro_buySession=a49185f692c202fa6abc5f2c1af8e410; bbsessionhash=Vjp9A0ADkEqY8_TDAVgCfJav8oDqco1r; _ugPsTakeoverShows=7; ug_previous_screen=myTabs; __gads=ID=09add47b3c8e8add:T=1759225758:RT=1759479788:S=ALNI_MZVA2I8l8hm4Tj24wY_BsJVAiXo9A; __gpi=UID=00001292bb81e5dc:T=1759225758:RT=1759479788:S=ALNI_MaR7ufJ_y0xl3cTZ0wdKQiVs-a4ag; __eoi=ID=74d697d938d8ee8c:T=1759225758:RT=1759479788:S=AA-AfjYZM0Pb74tzCK3kLcGjet8d; _ug_session_id=1.1759478465.1759479801.6; _ga_TBZHBDKRZC=GS2.1.s1759478473$o6$g1$t1759479807$j54$l0$h0';

function decodeHTMLEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractPlaylistsFromData(data) {
  const playlists = [];
  
  // Structure réelle découverte : data.store.page.data.list.list
  if (data.store?.page?.data?.list?.list && Array.isArray(data.store.page.data.list.list)) {
    const songs = data.store.page.data.list.list;
    
    console.log(`🎵 Found ${songs.length} favorite songs`);
    
    // Convertir les chansons favorites en playlist
    const playlistSongs = songs.map((song) => ({
      title: song.song_name || 'Unknown',
      artist: song.band_name || 'Unknown',
      url: song.song_url,
      playlistName: 'My Favorites'
    }));
    
    if (playlistSongs.length > 0) {
      playlists.push({
        name: 'My Favorites',
        songs: playlistSongs
      });
    }
  }
  
  return playlists;
}

async function testUrlsExtraction() {
  console.log('🔗 Test d\'extraction des URLs...');
  console.log('👤 Utilisateur: bonobobig (ID: 2489635)');
  
  try {
    const response = await fetch('https://www.ultimate-guitar.com/user/mytabs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': testCookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Chercher les données JSON
    const storeElements = $('.js-store');
    console.log(`🔍 Found ${storeElements.length} .js-store elements`);
    
    storeElements.each((i, elem) => {
      const $elem = $(elem);
      const dataContent = $elem.attr('data-content');
      
      if (dataContent) {
        console.log(`📦 Analyzing store element ${i + 1}...`);
        
        try {
          const decodedData = decodeHTMLEntities(dataContent);
          const data = JSON.parse(decodedData);
          
          // Utiliser la nouvelle fonction d'extraction
          const playlists = extractPlaylistsFromData(data);
          
          if (playlists.length > 0) {
            console.log(`\n🎉 SUCCESS: Found ${playlists.length} playlist(s)!`);
            
            playlists.forEach((playlist, index) => {
              console.log(`\n📋 Playlist ${index + 1}: ${playlist.name}`);
              console.log(`   Songs: ${playlist.songs.length}`);
              
              // Vérifier les URLs des 5 premières chansons
              console.log('   URL Verification:');
              playlist.songs.slice(0, 5).forEach((song, songIndex) => {
                const hasUrl = song.url && song.url.length > 0;
                console.log(`     ${songIndex + 1}. "${song.title}" - ${song.artist}`);
                console.log(`        URL: ${hasUrl ? '✅ ' + song.url : '❌ No URL'}`);
              });
              
              // Compter les chansons avec URLs
              const songsWithUrls = playlist.songs.filter(song => song.url && song.url.length > 0);
              console.log(`\n   📊 Statistiques:`);
              console.log(`   - Chansons avec URL: ${songsWithUrls.length}/${playlist.songs.length}`);
              console.log(`   - Chansons sans URL: ${playlist.songs.length - songsWithUrls.length}`);
            });
          }
          
        } catch (parseError) {
          console.log(`⚠️ Error parsing JSON: ${parseError.message}`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUrlsExtraction();
