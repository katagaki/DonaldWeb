let DB = {};
let allFlat = [];
let CAT_LABELS = {};

function loadData() {
  return Promise.all([
    fetch("data/categories.json").then((r) => r.json()),
    fetch("data/sources.json")
      .then((r) => r.json())
      .then((sources) =>
        Promise.all(
          sources.map((key) =>
            fetch(`data/${key}.json`)
              .then((r) => r.json())
              .then((data) => ({ key, data }))
          )
        )
      ),
  ]).then(([categories, results]) => {
    CAT_LABELS = categories;
    results.forEach(({ key, data }) => {
      DB[key] = data;
      data.items.forEach((it) =>
        allFlat.push({
          ...it,
          src: key,
          srcColor: data.color,
          srcLabel: data.label,
        })
      );
    });
  });
}
