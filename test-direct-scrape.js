const cheerio = require('cheerio');

// Vos cookies
const testCookies = '_ug_unified_id=1.1759219702.495111842; ugapp%3AtopBannerShow%3ABTS2025_viewed=1759219702907; first_visit_key=2; _pbjs_userid_consent_data=3524755945110770; _ug_landing_visited=1; _ug_visitor=1687632604263886512; _gcl_au=1.1.1142981693.1759219709; _ga=GA1.1.17917952.1759219709; _ug_coldStartCompleteOnboarding=1; bbuserid=2489635; bbusername=bonobobig; bbpassword=a9974a5de2897aef9bdec88f93291312; bbregistertype=auth; _ug_comebackOfferModalViewed=1; _ug_ex_pro_offer_timer_end=1759306128795; _ug_ex_pro_offer_promo_viewed_time=1759219728808; uid2_identity={%22advertising_token%22:%22A4AAABmRHNYj5mtCh-6vWvXAmnCOt1Wcjt4s8I7zGllsB4DJkj2OEQYNEOBSSliNsvD64AE-Rr86OmvdgB2tDV3ythDmxgEJHYvHqL4muZ6o4WNGM9Df47oeQV3VAZ1tpP3B4HUTtCphBC_Yo1NNkSSWO-u8qxg2khDP3Q_LBumFaOfeEZryMJTAamRfHLhoSAuXgxl7hPY6CaGmqmr0x-w4Rg%22%2C%22refresh_token%22:%22AAAAGZLlD+yDnDpelRA+pUJL6f/vy0KTVdisoPy8+tR7jf9smXVs3ml/QNFftVre4NVw6YYSxVws7C6I//Sa537KbGDDpAfintKmRP8Pnw7tL5lmbhBSXR7edxFTIcno2kJEyDpiFCSaMUpl9VA3M1GfVby2krDIYVp3GM/lIozKMpSzxxWF7eUX9NRNI13BVMi8vCzR7MeYNq1X8dm0IWTBP8tdrIRdfkkBuaMqyxvuPYxVFnqvYRjM6r+P6OtVwcVYoE/K/0lR25sPG0FRjXzKq6MwoQjClj0BHmYzds3wdEDc9VR9jFmT5VkfE2uUL2quuzwTUryeQb2uywOoOz2ZDYvfnazfBGf4pkPZf3Vs8YYcRHf05O6CPAU8NaAY+EHx%22%2C%22identity_expires%22:1759478933019%2C%22refresh_expires%22:1761811733019%2C%22refresh_from%22:1759223333019%2C%22refresh_response_key%22:%22rYN1VdH/M9hzPxsV11VZZFASVoposoHoc9amLVN9meM=%22}; ug_react_recently_viewed=[%22tab:2488086%22]; _ug_Official=1; _ug_small_screen=0; __ug_v2_tab_tools_chordType=piano; _cc_id=964e99a660f54ab28dac6555cbe62e41; panoramaId=27192f4811e3a1422ab47e7d26de16d5393862bb5f615525b7f7c8897998d65d; panoramaId_expiry=1759830558944; panoramaIdType=panoIndiv; _ug_playerSideShowsPerDay=4; _ug_ex_pro_offer_key=true; localization=en; static_cache_key_v2=_ver1759426476; connectId={"ttl":86400000,"lastUsed":1759428771397,"lastSynced":1759428771397}; _pro_buySession=a49185f692c202fa6abc5f2c1af8e410; bbsessionhash=Vjp9A0ADkEqY8_TDAVgCfJav8oDqco1r; _ugPsTakeoverShows=7; ug_previous_screen=myTabs; __gads=ID=09add47b3c8e8add:T=1759225758:RT=1759479788:S=ALNI_MZVA2I8l8hm4Tj24wY_BsJVAiXo9A; __gpi=UID=00001292bb81e5dc:T=1759225758:RT=1759479788:S=ALNI_MaR7ufJ_y0xl3cTZ0wdKQiVs-a4ag; __eoi=ID=74d697d938d8ee8c:T=1759225758:RT=1759479788:S=AA-AfjYZM0Pb74tzCK3kLcGjet8d; _ug_session_id=1.1759478465.1759479801.6; _ga_TBZHBDKRZC=GS2.1.s1759478473$o6$g1$t1759479807$j54$l0$h0';

// Test avec plusieurs URLs de vos favoris
const testUrls = [
  {
    title: 'Viva La Vida',
    artist: 'Coldplay',
    url: 'https://tabs.ultimate-guitar.com/tab/coldplay/viva-la-vida-official-1910847'
  },
  {
    title: 'Shallow',
    artist: 'Misc Soundtrack',
    url: 'https://tabs.ultimate-guitar.com/tab/misc-soundtrack/a-star-is-born-shallow-chords-2488086'
  },
  {
    title: 'Perfect',
    artist: 'Ed Sheeran',
    url: 'https://tabs.ultimate-guitar.com/tab/ed-sheeran/perfect-chords-1956589'
  }
];

function decodeHTMLEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function scrapeSongFromUrl(songData) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎵 Testing: ${songData.title} by ${songData.artist}`);
  console.log(`🔗 URL: ${songData.url}`);
  console.log('='.repeat(70));
  
  try {
    const response = await fetch(songData.url, {
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
    
    console.log(`📄 Page loaded successfully (${html.length} characters)`);
    
    // Chercher les données dans .js-store
    let tabData = null;
    const dataContent = $('.js-store').attr('data-content');
    
    if (dataContent) {
      console.log('\n✅ Found .js-store element with data-content');
      try {
        const decodedData = decodeHTMLEntities(dataContent);
        const data = JSON.parse(decodedData);
        
        console.log('🔍 Analyzing data structure...');
        console.log(`   - store exists: ${!!data.store}`);
        console.log(`   - store.page exists: ${!!data.store?.page}`);
        console.log(`   - store.page.data exists: ${!!data.store?.page?.data}`);
        console.log(`   - store.page.data.tab_view exists: ${!!data.store?.page?.data?.tab_view}`);
        
        if (data.store?.page?.data?.tab_view) {
          const tabView = data.store.page.data.tab_view;
          
          console.log('   - wiki_tab exists:', !!tabView.wiki_tab);
          console.log('   - wiki_tab.content exists:', !!tabView.wiki_tab?.content);
          
          if (tabView.wiki_tab?.content) {
            tabData = {
              title: tabView.meta?.title || songData.title,
              artist: tabView.meta?.artist || songData.artist,
              content: tabView.wiki_tab.content,
              rating: tabView.votes?.value || 0,
              votes: tabView.votes?.count || 0,
              difficulty: tabView.meta?.difficulty || 'unknown',
              tuning: tabView.meta?.tuning?.value || 'standard',
              capo: tabView.meta?.capo || 0,
              type: tabView.meta?.type || 'unknown'
            };
          }
        }
      } catch (parseError) {
        console.log(`⚠️ Error parsing .js-store data: ${parseError.message}`);
        console.log(`   First 200 chars: ${dataContent.substring(0, 200)}`);
      }
    }
    
    if (tabData) {
      console.log('\n📊 Tab Information:');
      console.log(`   Title: ${tabData.title}`);
      console.log(`   Artist: ${tabData.artist}`);
      console.log(`   Rating: ${tabData.rating}/5 (${tabData.votes} votes)`);
      console.log(`   Difficulty: ${tabData.difficulty}`);
      console.log(`   Tuning: ${tabData.tuning}`);
      console.log(`   Capo: ${tabData.capo === 0 ? 'No capo' : `Fret ${tabData.capo}`}`);
      console.log(`\n📝 Content preview (first 500 chars):`);
      console.log('-'.repeat(70));
      console.log(tabData.content.substring(0, 500) + '...');
      console.log('-'.repeat(70));
      console.log(`\n✅ Total content length: ${tabData.content.length} characters`);
      
      return tabData;
    } else {
      console.log('\n❌ No tab data found in page');
      
      // Afficher des infos de débogage
      console.log('\n🔍 Debugging information:');
      console.log(`   - Script tags found: ${scriptTags.length}`);
      console.log(`   - Page title: ${$('title').text()}`);
      
      // Chercher d'autres structures possibles
      const dataContent = $('.js-store').attr('data-content');
      if (dataContent) {
        console.log('   - Found .js-store element with data-content');
        try {
          const decodedData = decodeHTMLEntities(dataContent);
          const data = JSON.parse(decodedData);
          if (data.store?.page?.data?.tab_view) {
            console.log('   - Tab data might be in .js-store instead');
          }
        } catch (e) {
          console.log('   - Could not parse .js-store data');
        }
      }
      
      return null;
    }
    
  } catch (error) {
    console.error(`\n❌ Error scraping ${songData.title}:`, error.message);
    return null;
  }
}

async function testAllSongs() {
  console.log('🚀 Starting Ultimate Guitar Direct Scraper Test\n');
  
  const results = [];
  
  for (const songData of testUrls) {
    const result = await scrapeSongFromUrl(songData);
    results.push({
      ...songData,
      success: result !== null,
      contentLength: result?.content?.length || 0
    });
    
    // Pause entre les requêtes pour ne pas surcharger le serveur
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${results.length - successCount}/${results.length}`);
  
  console.log('\nDetailed Results:');
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.title} by ${result.artist}`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.success) {
      console.log(`   Content: ${result.contentLength} characters`);
    }
  });
  
  console.log('\n🎉 Test completed!\n');
}

testAllSongs();
