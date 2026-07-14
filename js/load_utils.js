const OBJ_THOLDS = {
  bird: 0,
  dog: 0,
  horse: 0,
  ox: 1,
  "painting of human": 1,
  bush: 0,
  flower: 0,
  fruit: 0,
  grass: 0,
  greenery: 0,
  shrub: 0,
  tree: 0,
  vegetation: 1,
  conifer: 0,
  "palm tree": 0,
  "human face": 1,
  "human hand": 1,
  "naked human back": 1,
  "naked human breast": 1,
  "naked human buttocks": 1,
  "naked human torso": 1,
};

const COLLECTION_LABELS = {
  "Museu Victor Meirelles": "Victor Meirelles",
  "Museu Regional Casa dos Ottoni": "Casa dos Ottoni",
  "Museu Regional São João Del Rey": "São João Del Rey",
  "Museu Regional do Caeté": "Regional do Caeté",
  "Museu Casa da Hera": "Casa da Hera",
  "Museu Casa de Benjamin Constant": "Benjamin Constant",
  "Museu de Arqueologia de Itaipu": "Arqueologia de Itaipu",
  "Museu do Diamante": "Museu do Diamante",
  "Museu da Inconfidência": "Museu da Inconfidência",
  "MAC USP": "MAC USP",
  "Museu Nacional de Belas Artes": "Belas Artes",
  "Pinacoteca de São Paulo": "Pinacoteca de São Paulo",
  "Museu Paulista": "Museu Paulista",
  "MASP": "MASP",
  "Instituto Hércules Florence": "Hércules Florence",
  "Museu Histórico Nacional": "Histórico Nacional",
  "Coleção Brasiliana Itaú": "Brasiliana Itaú",
};

const NUM_CLUSTERS = 8;

async function fetchData(mUrl) {
  const response = await fetch(mUrl);
  return await response.json();
}

function pruneCollections(menuData, thold=10) {
  menuData.collections = Object.entries(menuData.collections).reduce((acc, [k, v]) => {
    if (v.length >= thold && !k.includes("Religiosa e Tradicional")) {
      acc[COLLECTION_LABELS[k]] = v;
    }

    return acc;
  }, {});
  return menuData;
}

function createMenuData(metaData, clusterData) {
  const menuData = {
    categories: {},
    collections: {},
    clusters: [],
    dates: {},
    objects: {},
  };

  for (const id of Object.keys(metaData)) {
    const item = metaData[id];
    const col = item.museum;

    item.objects = item.objects.filter(o => o.score > OBJ_THOLDS[o.label]);

    if (!(col in menuData.collections)) {
      menuData.collections[col] = [];
    }
    menuData.collections[col].push(id);

    for (const cat of item.categories) {
      if (!(cat in menuData.categories)) {
        menuData.categories[cat] = [];
      }
      menuData.categories[cat].push(id);
    }

    for (const obj of item.objects) {
      if (!(obj.label in menuData.objects)) {
        menuData.objects[obj.label] = [];
      }
      menuData.objects[obj.label].push(id);
    }
  }

  const lang = window.location.href.includes("en") ? "en" : "pt";
  menuData.clusters.labels = clusterData[NUM_CLUSTERS].clusters.descriptions.gemma3[lang].map(x => x.join(", "));
  menuData.clusters.ids = new Array(NUM_CLUSTERS).fill(null).map(() => []);

  for (const [id, { cluster, distances }] of Object.entries(clusterData[NUM_CLUSTERS].images)) {
    menuData.clusters.ids[cluster].push(id);
  }

  const nowYear = new Date().getFullYear();

  Object.entries(metaData).forEach(([id, v]) => metaData[id].year = Math.min(v.year, nowYear + 1));

  const idsYears = Object.values(metaData).map(x => [x.id, x.year]);
  const allYears = idsYears.map(x => x[1]);
  const validYears = allYears.filter(x => x <= nowYear);

  menuData.dates.min = Math.min(...validYears);
  menuData.dates.max = Math.max(...validYears);
  menuData.dates.maxAll = Math.max(...allYears);

  const yearsIds = idsYears.reduce((acc, [id, year]) => {
    if (!(year in acc)) {
      acc[year] = [];
    }
    acc[year].push(`${id}`);
    return acc;
  }, {});

  menuData.dates.yearsIds = Object.entries(yearsIds).map(([year, ids]) => ({ year: parseInt(year), ids })).toSorted((a,b) => a.year - b.year);

  return pruneCollections(menuData);
}

function combineClusterData(metaData, clusterData) {
  for (const id of Object.keys(metaData)) {
    metaData[id].cluster = {
      idx: clusterData[NUM_CLUSTERS].images[id].cluster,
      distances: clusterData[NUM_CLUSTERS].images[id].distances,
    }
  }
  return metaData;
}

export { fetchData, createMenuData, combineClusterData };
