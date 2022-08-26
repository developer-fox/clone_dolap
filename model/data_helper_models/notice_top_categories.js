
module.exports = {
  kadin: {
    value: "Kadın",
    medium_categories: {
      giyim: {
        value: "Giyim",
        bottom_categories:{
          ustGiyim: {value: "Üst Giyim",
            detail_categories: ["Gömlek", "Tunik","Büstiyer", "Ceket/Blazer", "Bluz","Tshirt","Hırka","Kazak", "Sweatshirt","Diğer"],
          },
          altGiyim: {value: "Alt Giyim",
            detail_categories: ["jean","Pantolon","Kısa Etek","Uzun Etek","Şort/Bermuda","Kısa Pantolon","Tulum","Tayt"]},
          elbise: {value: "Elbise",
            detail_categories: ["Günlük Elbise","Ofis Elbisesi","Kısa Elbise","Uzun Elbise","Gece Elbisesi","Gelinlik","Kına Elbisesi","Tesettür Elbise","Tesettür Abiye"],
          },
          disGiyim: {value: "Dış Giyim",
            detail_categories: ["Trençkot/Pardesü","Yağmurluk","Deri Ceket","Kot Ceket","Yelek","Parka","Mont","Kaban/Palto","Peluş Kürk","Diğer","Abaya","Kimono/Kaftan"],
          },
          plajGiyim: {value: "Plaj Giyim", 
            detail_categories: ["Bikini","Mayo","Plaj Kıyafeti","Tesettür Mayo","Pareo"],  
          },
          evGiyim: {value: "Ev Giyim", 
            detail_categories: ["Gecelik","Pijama","Sabahlık","Uyku Gözlüğü","Eşofman"],
          },
          ikiliTakim: {value: "İkili Takım",
            detail_categories: ["İkili Takım"],
          },
        }
      },
      canta: {
        value: "Çanta",
        bottom_categories:{
          kolCantasi: {value: "Kol Çantası"},
          askiliCanta: {value: "Askılı Çanta"},
          sirtCantasi: {value: "Sırt Çantası"},
          cuzdan: {value: "Cüzdan"},
          portfoyVeElCantasi: {value: "Portfoy/El Çantası"},
          plajCantasi: {value: "Plaj Çantası"},
          makyajCantasi: {value: "Makyaj Çantası"},
          valizVeBavul: {value: "Valiz / bavul"},
          belCantasi: {value: "Bel Çantası"},
          diger: {value: "Diğer"},
        }
      },
      ayakkabı: {
        value: "Ayakkabı",
        bottom_categories:{
          sporAyakkabi: {value: "Spor Ayakkabı"},
          babet: {value: "Babet"},
          inceTopuklu: {value: "İnce Topuklu"},
          kalinTopuklu: {value: "Kalın Topuklu"},
          dolguTopuklu: {value: "Dolgu Topuklu"},
          oxfordVELoafer: {value: "Oxford/Loafer"},
          sandalet: {value: "Sandalet"},
          terlik: {value: "Terlik"},
          bot: {value: "Bot"},
          Çizme: {value: "Çizme"},
          topukluSandalet: {value: "Topuklu Sandalet"},
        }
      },
      aksesuar: {
        value: "Aksesuar",
        bottom_categories:{
          gozluk: {value: "Gözlük"},
          saat: {value: "Saat"},
          taki: {value: "Takı"},
          kemer: {value: "Kemer"},
          salVeEsarp: {value: "Şal/Eşarp"},
          eldiven: {value: "Eldiven"},
          atki: {value: "Atkı"},
          bere: {value: "Bere"},
          sapka: {value: "Şapka"},
          sacAksesuarlari: {value: "Saç Aksesuarları"},
          corap: {value: "Çorap"},
          gelinBuketi: {value: "Gelin Buketi"},
          diger: {value: "Diğer"},
          semsiye: {value: "Şemsiye"},
        }
      },
      hamile: {
        value: "Hamile",
        bottom_categories:{
          ustGiyim: {value: "Üst Giyim"},
          altGiyim: {value: "Alt Giyim"},
          tulum: {value: "Tulum"},
        }
      },
      kozmetik: {
        value: "Kozmetik",
        bottom_categories:{
          ciltBakimi: {value: "Cilt Bakımı"},
          elVeTirnakBakimi: {value: "El / Tırnak Bakımı"},
          sacBakimi: {value: "Saç Bakımı"},
          vucutVeBanyo: {value: "Vücut/ Banyo"},
          parfumVeDeodorant: {value: "Parfüm/ Deodorant"},
          gozMakyaji: {value: "Göz Makyajı"},
          dudakMakyaji: {value: "Dudak Makyajı"},
          yuzMakyaji: {value: "Yüz Makyajı"},
          aksesuarVeFircalar: {value: "Aksesuar/ Fırçalar"},
        }
      },
      icGiyim: {
        value: "İç Giyim",
        bottom_categories:{
          atletVeFanila: {value: "Atlet Ve Fanila"},
          sütyen: {value: "Sütyen"},
          sporSutyeni: {value: "Spor Sütyeni"},
          kulot: {value: "Külot"},
          boxer: {value: "Boxer"},
          string: {value: "String"},
          icCamasiriTakimlari: {value: "İç çamaşırı Takımları"},
          termalGiyimVeIclik: {value: "Termal Giyim/ İçlik"},
          korse: {value: "Korse"},
          kombinezonVeJupon: {value: "Kombinezon/ Jüpon"},
        }
      },
      sporVeAutdoor: {
        value: "Spor&outdoor",
        bottom_categories:{
          outdoorAksesuar: {value: "Outdoor Aksesuar"},
          outdoorAyakkabi: {value: "Outdoor Ayakkabı"},
          outdoorGiyim: {value: "Outdoor Giyim"},
        }
      },
    }
  },
  bebekVeCocuk:{
    value: "Bebek ve Çocuk",
    medium_categories: {
      bebek: {
        value: "Bebek",
        bottom_categories:{
          giyim: {value: "Giyim"},
          ayakkabi: { value: "Ayakkabı"},
          aksesuar: { value: "Aksesuar"},
          aracVeGerec: { value: "Araç & Gereç"},
        },
      kizCocuk: {
        value: "Kız Çocuk",
        bottom_categories:{
          giyim: {value: "Giyim"},
          ayakkabi: { value: "Ayakkabı"},
          aksesuar: { value: "Aksesuar"},
        },
      },
      erkekCocuk: {
        value: "Erlek Çocuk",
        bottom_categories:{
          giyim: {value: "Giyim"},
          ayakkabi: { value: "Ayakkabı"},
          aksesuar: { value: "Aksesuar"},
        },
      },
      oyuncakVeKitap: {
        value: "Oyuncak & Kitap",
        bottom_categories:{
          egiticiOyuncak: {value: "Eğitici Oyuncak"},
          figurVePelusOyuncak: {value: "Figür & Peluş Oyuncak"},
          kitapVeKirtasiye: {value: "Kitap & Kırtasiye"},
          plajVeBahceOyuncagi: {value: "Plaj & Bahçe Oyuncağı"},
          kumandaVeAkuluArac: {value: "Kumanda & Akülü Araç"},
          scooterVePaten: {value: "Scooter & Paten"},
        }
      },
      },
    },
  },
  evVeYasam: {
    value: "Ev ve Yaşam",
    medium_categories: {
      hobi: {
        value: "Hobi",
        bottom_categories:{
          kutuOyunlari: {value: "Kutu Oyunları"},
          puzzle: {value: "Puzzle"},
          maket: {value: "Maket"},
          partiMalzemeleri: {value: "Parti Malzemeleri"},
          oyunTakimi: {value: "Oyun Takımı"},
          yilbasiUrunleri: {value: "Yılbaşı Ürünleri"},
          hediyelikler: {value: "Hediyelikler"},
          elIsiMalzemeleri: {value: "El İşi malzemeleri"},
          drone: {value: "Drone"},
          muzikAletleri: {value: "Müzik Aletleri"},
        }
      },
      sporAletleri: {
        value: "Spor Aletleri",
        bottom_categories:{
          sporMati: {value: "Spor Matı"},
          basketbolTopu: {value: "Basketbol Topu"},
          pilatesTopu: {value: "Pilates Topu"},
          pilatesBanti: {value: "Pilates Bantı"},
          futbolTopu: {value: "Futbol Topu"},
          kaykay: {value: "Kaykay"},
          pilatesCemberi: {value: "Pilates Çemberi"},
          kosuBandi: {value: "Koşu Bandı"},
          yogaKemeri: {value: "Yoga Kemeri"},
          yogaBlogu: {value: "Yoga Bloğu"},
          atlamaIpi: {value: "Atlama İpi"},
          stepTahtasi: {value: "Step Tahtası"},
          scooter: {value: "Scooter"},
          tenisRaketi: {value: "Tenis Raketi"},
          tenisTopu: {value: "Tenis Topu"},
          voleybolTopu: {value: "Voleybol Topu"},
        }
      },
      dekorasyon: {
        value: "Dekorasyon",
        bottom_categories:{
          duvarSaati: {value: "Duvar Saati"},
          masaSaati: {value: "Masa Saati"},
          dekoratifAksesuar: {value: "Dekoratif Aksesuar"},
          duvarKagidi: {value: "Duvar Kağıdı"},
          tablo: {value: "Tablo"},
          mum: {value: "Mum"},
          biblo: {value: "Biblo"},
          vazo: {value: "Vazo"},
          cerceve: {value: "Çerçeve"},
          mumVeMumluk: {value: "Mum/ Mumluk"},
          Saksi: {value: "Saksı"},
          ayna: {value: "Ayna"},
          yapayBitkiler: {value: "Yapay Bitkiler"},
        }
      },
      duzenleyici: {
        value: "Düzenleyici",
        bottom_categories:{
          bagajVeAracDuzenleyici: {value: "Bagaj/Araç Düzenleyici"},
          makyajDuzenleyici: {value: "Makyaj DÜzenleyici"},
          dolapIciDuzenleyici: {value: "Dolap İçi Düzenleyici"},
          aski: {value: "Askı"},
          sepetVeHurc: {value: "Sepet/Hurç"},
          kasiklik: {value: "Kaşıklık"},
        }
      },
      banyo:{
        value: "Banyo",
        bottom_categories:{
          banyoSeti: {value: "Banyo Seti"},
          bornoz: {value: "Bornoz"},
          havluVeHavluSeti: {value: "Havlu & Havlu Seti"},
          pestemal: {value: "Peştemal"},
          copKovasi: {value: "Çöp Kovası"},
        }
      },
      mutfakTekstili: {
        value: "Mutfak Tekstili",
        bottom_categories:{
          masaOrtusu: {value: "Masa Örtüsü"},
          mutfakHavlusu: {value: "Mutfak Havlusu"},
          onlukVeEldivenVeTutamac: {value: "Önlük/Eldiven/Tutamaç"},
          amerikanServis: {value: "Amerikan Servis"},
          kumasPecete: {value: "Kumaş Peçete"},
        }
      },
      mutfakEsyalari:{
        value: "Mutfak Eşyaları",
        bottom_categories:{
          saklamaKaplari: {value: "Saklama Kapları"},
          yemekTakimlari: {value: "Yemek Takımları"},
          kahvaltiTakimlari: {value: "Kahvaltı Takımları"},
          tabakVeKase: {value: "Tabak/Kase"},
          tencereVeTencereSeti: {value: "Tencere/Tencere Seti"},
          tavaVeTavaSeti: {value: "Tava/Tava Seti"},
          Caydanlik: {value: "Çaydanlık"},
          baharatTakimi: {value: "Baharat Takımı"},
          catalVeKasikVeBicak: {value: "Çatal/Kaşık/Bıçak"},
          cezve: {value: "Cezve"},
          kekKaliplari: {value: "Kek Kalıpları"},
          firinKabi: {value: "Fırın Kabı"},
          tepsi: {value: "Tepsi"},
          bardakVeKadeh: {value: "Bardak/Kadeh"},
          kupaVeFincan: {value: "Kupa/Fincan"},
          sulukVeTermos: {value: "Suluk/Termos"},
          frenchPress: {value: "French Press"},
        }
      },
      evTekstili:{
        value: "Ev Tekstili",
        bottom_categories:{
          pikeVePikeTakimi: {value: "Pike/Pike Takımı"},
          minder: {value: "Minder"},
          battaniye: {value: "Battaniye"},
          yorgan: {value: "Yorgan"},
          yastik: {value: "Yastık"},
          yastikKilifi: {value: "Yastık Kılıfı"},
          kirlent: {value: "Kırlent"},
          perde: {value: "Perde"},
          haliVeKilimVePaspas: {value: "Halı/Kilim/Paspas"},
          nevresimTakimi: {value: "Nevresim Takımı"},
          carsafTakimi: {value: "Çarşaf Takımı"},
          yatakOrtusu: {value: "Yatak Örtüsü"},
          koltukKilifi: {value: "Koltuk Kılıfı"},
          seccade: {value: "Seccade"},
        }
      },
      kitap: {
        value: "Kitap",
        bottom_categories:{
          polisiye: {value: "Polisiye"},
          fantastikMacera: {value: "Fantastik Macera"},
          kisiselGelisim: {value: "Kişisel Gelişim"},
          edebiyat: {value: "Edebiyat"},
          egitim: {value: "Eğitim"},
          arastirma: {value: "Araştırma"},
          tarih: {value: "Tarih"},
          dersVeSinav: {value: "Ders/Sınav"},
          mitoloji: {value: "Mitoloji"},
          din: {value: "Din"},
        }
      },
      kirtsiyeVeOfisMalzemeleri: {
        value: "Kırtasiye Ve Ofis Malzemeleri",
        bottom_categories:{
          ofisAksesuarlari: {value: "Ofis Aksesuarları"},
          panoVeYaziTahtasi: {value: "Pano/Yazı Tahtası"},
          dosyaVeKlasor: {value: "Dosya/Klasör"},
          ajanda: {value: "Ajanda"},
          kalemlik: {value: "Kalemlik"},
          boyaMalzemeleri: {value: "Boya Malzemeleri"},
          boyaSeti: {value: "Boya Seti"},
          kalemVeSilgi: {value: "Kalem/Silgi"},
          defter: {value: "Defter"},
          fotokopiKagidi: {value: "Fotokopi Kağıdı"},
          etiketVeZarf: {value: "Etiket/Zarf"},
          hesapMakinesi: {value: "Hesap Makinesi"},
          atasVeZimbaVeDelgec: {value: "Ataş/Zımba/Delgeç"},
          cetvelVePergel: {value: "Cetvel/Pergel"},
          bantMakinesi: {value: "Bant Makinesi"},
          kaseIstampa: {value: "Kaşe Istampa"},
        }
      },
      aydinlatma:{
        value: "Aydınlatma",
        bottom_categories:{
          abajur: {value: "Abajur"},
          ampul: {value: "Ampul"},
          aplik: {value: "Aplik"},
          avize: {value: "Avize"},
          lambader: {value: "Lambader"},
          masaLambasi: {value: "Masa Lambası"},
        }
      },
      petshopUrunleri: {
        value: "Petshop Urunleri",
        bottom_categories:{
          balikUrunleri: {value: "Balık Ürünleri"},
          hamsterVeTavsanUrunleri: {value: "Hamster & Tavşan Ürünleri"},
          kaplumbagaUrunleri: {value: "Kaplumbağa Ürünleri"},
          kediUrunleri: {value: "Kedi Ürünleri"},
          kopekUrunleri: {value: "Köpek Ürünleri"},
          kusUrunleri: {value: "Kuş Ürünleri"},
        }
      },
      yapiMarket: {
        value: "Yapı Market",
        bottom_categories:{
          elektrikliElAletleri: {value: "Elektrikli El Aletleri"},
          hirdavatUrunleri: {value: "Hırdavat Ürünleri"},
          banyoYapiMalzemeleri: {value: "Banyo Yapı Malzemeleri"},
          manuelElAletleri: {value: "Manuel El Aletleri"},
          insaatMalzemeleri: {value: "İnşaat Malzemeleri"},
          guvenlikUrunleri: {value: "Güvenlik Ürünleri"},
          elektrikVeAydinlatmaUrunleri: {value: "Elektrik & Aydınlatma Ürünleri"},
          elektrikVeTesisatMalzemeleri: {value: "Elektrik & Tesisat Malzemeleri"},
        },
      },
      bahceMalzemeleri: {
        bahceMakineleri: {value: "Bahçe Makineleri"},
        manbalVeBarbeku: {value: "Mangal/Barbekü"},
        bahceMobilyasi: {value: "Bahçe Mobilyası"},
        cicekBakimVeBitkiAletleri: {value: "Çiçek Bakım & Bitki Aletleri"},
        kucukElAletleri: {value: "Küçük El Aletleri"},
        bahceDekorasyonu: {value: "Bahçe Dekorasyonu"},
        bahceSulama: {value: "Bahçe Sulama"},
      },
      sporVeOutdoor: {
        value: "Spor & Outdoor",
        bottom_categories:{
          kampVeKampcilikMalzemeleri: {value: "Kamp Ve Kampçılık Malzemeleri"},
          kisSporlari: {value: "Kış Sporları"},
        },
      },
      temizlikGerecleri: {
        value: "Temizlik Gerecleri",
        bottom_categories:{
          mopVePaspas: {value: "Mop ve Paspas"},
          camSilecek: {value: "Cam Silecek"},
          temizlikSeti: {value: "Temizlik Seti"},
          copKovasi: {value: "Çöp Kovası"},
          tuyToplayici: {value: "Tüy Toplayıcı"},
          temizlikBezi: {value: "Temizlik Bezi"},
        }
      },
    }

  },
  erkek: {
    value: "Erkek",
    medium_categories: {
      ayakkabi: {
        value: "Ayakkabı",
        bottom_categories:{
          gunlukAyakkabi: {value: "Günlük Ayakkabı"},
          sporAyakkabi: {value: "Spor Ayakkabı"},
          botVeCizme: {value: "Bot/Çizme"},
          sandaletVeTerlik: {value: "Sandalet ve Terlik"},
          evTerligi: {value: "Ev Terliği"},
          ayakkabiBakim: {value: "Ayakkabı Bakım"},
        }
      },
      giyim: {
        value: "Giyim",
        bottom_categories:{
          ustGiyim: {value: "Üst Giyim"},
          altGiyim: {value: "Alt Giyim"},
          disGiyim: {value: "Dış Giyim"},
          icGiyim: {value: "İç Giyim"},
          takimElbise: {value: "Takım Elbise"},
          evGiyim: {value: "Ev Giyim"},
          plajGiyim: {value: "Plaj Giyim"},
        },
      },
      canta: {
        value: "Çanta",
        bottom_categories:{
          postaciCantasi: {value: "Postacı Çantası"},
          sirtCantasi: {value: "Sırt Çantası"},
          belCantasi: {value: "Bel Çantası"},
          omuzCantasi: {value: "Omuz Çantasi"},
          sporCantasi: {value: "Spor Çantası"},
          evrakCantasi: {value: "Evrak Çantası"},
          valizVeBavul: {value: "Valiz / bavul"},
          cuzdan: {value: "Cüzdan"},
          kartlik: {value: "Kartlık"},
        }
      },
      aksesuar: {
        value: "Aksesuar",
        bottom_categories:{
          gunesGozlugu: {value: "Güneş Gözlüğü"},
          saat: {value: "Saat"},
          kemer: {value: "Kemer"},
          sapka: {value: "Şapka"},
          tesbih: {value: "Tesbih"},
          kolDugmesi: {value: "Kol Düğmesi"},
          kravat: {value: "Kravat"},
          mendil: {value: "Mendil"},
          pantolonAskisi: {value: "Pantolon Askısı"},
          papyon: {value: "Papyon"},
          taki: {value: "Takı"},
          atki: {value: "Atkı"},
          bere: {value: "Bere"},
          eldiven: {value: "Eldiven"},
          digerAksesuar: {value: "Diğer Aksesuar"},
          semsiye: {value: "Şemsiye"},
        }
      },
      kozmetik: {
        value: "Kozmetik",
        bottom_categories:{
          parfumVeDeodorant: {value: "Parfüm/Deodorant"},
          tirasUrunleri: {value: "Tıraş Ürünleri"},
          ciltBakimi: {value: "Cilt Bakımı"},
          sacBakimi: {value: "Saç Bakımı"},
        },
        sporVeOutdoor: {
          value: "Spor & Outdoor",
          bottom_categories:{
            outdoorAksesuar: {value: "Outdoor Aksesuar"},
            outdoorAyakkabi: {value: "Outdoor Ayakkabı"},
            outdoorGiyim: {value: "Outdoor Giyim"},
          }
        }
      }
    },
  },
  elektronik: {
    value: "Elektronik",
    medium_categories:{
      telefonVeTelefonAksesuarlari:{
        value: "Telefon & Telefon Aksesuarları",
        bottom_categories:{
          iphone: {value: "İPhone"},
          androidTelefonlar: {value: "Android Telefonlar"},
          digerTelefonlar: {value: "Diğer Telefonlar"},
          powerbank: {value: "Powerbank"},
          telefonAksesuarlari: {value: "Telefon Aksesuarları"},
          telefonKilifi: {value: "Telefon Kılıfı"},
          sarjCihazi: {value: "Şarj Cihazı"},
          telefonTutucu: {value: "Telefon Tutucu"},
          selfieCubuguVeStand: {value: "Selfie Çubuğu & Stand"},
          bluetoothAracKiti: {value: "Bluetooth Araç Kiti"},
          ekranKoruyucuFilm: {value: "Ekran Koruyucu Film"},
          hafizaKarti: {value: "Hafıza Kartı"},
        }
      },
      giyilebilirTeknoloji:{
        value: "Giyilebilir Teknoloji",
        bottom_categories:{
          akilliSaat: {value: "Akıllı Saat"},
          akilliBileklik: {value: "Akıllı Bileklik"},
        },
      },
      bilgisayarVeTablet:{
        value: "Bilgisayar & Tablet",
        bottom_categories:{
          dizustuBilgisayar: {value: "Dizüstü Bilgisayar"},
          tablet: {value: "Tablet"},
          masaustuBilgisayar: {value: "Masaüstü Bilgisayar"},
          eKitapOkuyucu: {value: "E-Kitap Okuyucu"},
          monitor: {value: "Monitör"},
          sarjCihazlari: {value: "Şarj Cihazları"},
          mouse: {value: "Mouse"},
          usbBellek: {value: "Usb Bellek"},
          tasinabilirDisk: {value: "Taşınabilir Disk"},
          bilgisayarBilesenleri: {value: "Bilgisayar Bileşenleri"},
          aksesuar: {value: "Aksesuar"},
          klavye: {value: "Klavye"},
        }
      },
      goruntuVeSes: {
        value: "Görüntü Ve Ses",
        bottom_categories:{
          kulaklik: {value: "Kulaklık"},
          muzikSistemi: {value: "Müzik Sistemi"},
          kasetVeCdVePlak: {value: "Kaset/CD/Plak"},
          mikrofon: {value: "Mikrofon"},
          projeksiyonCihazi: {value: "Projeksiyon Cihazı"},
          uyduAlicisi: {value: "Uydu Alıcısı"},
          kabloVeSarfMalzemeleri: {value: "Kablo & Sarf Malzemeleri"},
          mediaPlayer: {value: "Media Player"},
        }
      },
      oyuncularaOzel:{
        value: "Oyunculara Özel",
        bottom_categories:{
          bilgisayarOyunlari: {value: "Bilgisayar Oyunları"},
          konsolOyunlari: {value: "Konsol Oyunları"},
          oyunBilgisayari: {value: "Oyun Bilgisayarı"},
          playstation: {value: "Playstation"},
          xbox: {value: "Xbox"},
          nintendo: {value: "Nintendo"},
          oyuncuKlavye: {value: "Oyuncu Klavye"},
          oyuncuMouse: {value: "Oyuncu Mouse"},
          mousePad: {value: "Mouse Pad"},
          oyuncuKulaklik: {value: "Oyuncu Kulaklık"},
          direksiyonSeti: {value: "Direksiyon Seti"},
          joystickVeGamepad: {value: "Joystick & Gamepad"},
        }
      },
      fotografVeKamera:{
        value: "Fotograf Ve Kamera",
        bottom_categories:{
          dijitalFotografMakineleri: {value: "Dijital Fotoğraf Makineleri"},
          filmliFotografMakieneleri: {value: "Filmli Fotoğraf Makineleri"},
          aksiyonKamerasi: {value: "Aksiyon Kamerası"},
          aksesuar: {value: "Aksesuar"},
          videoKamera: {value: "Video Kamera"},
          teleskop: {value: "Teleskop"},
          durbun: {value: "Dürbün"},
          diger: {value: "Diğer"},
        },  
      },
      yaziciVeTarayici: {
        value: "Yazıcı Ve Tarayıcı",
        bottom_categories:{
          yazici: {value: "Yazıcı"},
          tarayici: {value: "Tarayıcı"},
          yaziciSarfMalzemeleri: {value: "Yazıcı Sarf Malzemeleri"},
        }
      },
      kisiselBakimAletleri:{
        value: "Kişisel Bakım Aletleri",
        bottom_categories:{
          sacKurutmaMakinesi: {value: "Saç Kurutma Makinesi"},
          sacDuzlestirici: {value: "Saç Düzleştirici"},
          epilasyonAletleri: {value: "Epilasyon Aletleri"},
          lazerEpilasyon: {value: "Lazer Epilasyon"},
          yuzTemizlemeMakinesi: {value: "Yüz Temizleme Makinesi"},
          tirasMakinesi: {value: "Tıraş Makinesi"},
          diger: {value: "Diğer"},
        }
      },
      elektrikliMutfakAletleri: {
        value: "Elektrikli Mutfak Aletleri",
        bottom_categories:{
          ekmekVeYogurtYapmaMakinesi: {value: "Ekmek ve Yoğurt Yapma Makinesi"},
          kahveMakinesi: {value: "Kahve Makinesi"},
          blenderVeDograyicilar: {value: "Blender/Doğrayıcılar"},
          mikserVeMikserSeti: {value: "Mikser/Mikser Seti"},
          meyveVeSebzeSikacagi: {value: "Meyve/Sebze Sıkacağı"},
          ekmekKizartmaMakinesi: {value: "Ekmek Kızartma Makinesi"},
          suIsiticiVeKettle: {value: "Su Isıtıcı/Kettle"},
          izgaraVeFritoz: {value: "Izgara/Fritöz"},
          misirPatlatmaMakinesi: {value: "Mısır Patlatma Makinesi"},
          diger: {value: "Diğer"},
        }
      },
      elektrikliElAletleri: {
        value: "Elektrikli El Aletleri",
        bottom_categories:{
          tarti: {value: "Tartı"},
          supurge: {value: "Süpürge"},
          utu: {value: "Ütü"},
          dikisMakinesi: {value: "Dikiş Makinesi"},
          havaTemizlemeMakinesi: {value: "Hava Temizleme Makinesi"},
          vantilator: {value: "Vantilatör"},
          isiticilar: {value: "Isıtıcılar"},
          diger: {value: "Diğer"},
        }
      }
    }
  }
}