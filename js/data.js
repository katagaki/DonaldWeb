let DB = {};
let allFlat = [];

function loadData() {
  return fetch("data/sources.json")
    .then((r) => r.json())
    .then((sources) =>
      Promise.all(
        sources.map((key) =>
          fetch(`data/${key}.json`)
            .then((r) => r.json())
            .then((data) => ({ key, data }))
        )
      )
    )
    .then((results) => {
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
