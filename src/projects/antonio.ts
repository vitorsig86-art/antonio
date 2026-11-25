import { templateProject } from "./template";
import { antonioMacroLayers } from "./antonioMacro";
import type { GeographicBounds, LayerSource, ProjectConfig, ProjectLayerConfig, VectorPopupConfig } from "./types";

const r2 = "https://pub-87a0f753169b4f8ab3f276d52702c8c7.r2.dev";

// Cobertura das pirâmides em graus (oeste, sul, leste, norte), convertida de EPSG:3857.
const bounds: GeographicBounds = [-47.8125, -23.241346102386164, -46.40625, -21.94304553343772];

function raster(id: string, name: string, folder: string): ProjectLayerConfig {
  return {
    id, name, description: "", kind: "raster", group: "raster", defaultVisible: false,
    source: {
      format: "tms", url: `${r2}/${folder}/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
      bounds, minimumLevel: 8, maximumLevel: 17, tileWidth: 256, tileHeight: 256,
    },
  };
}

type GeoJsonSource = Extract<LayerSource, { format: "geojson" }>;
const namedFeature = { property: "nome", label: "Nome" };
const contributingArea = { property: "area_contribuicao_ha", label: "Área de contribuição", suffix: " ha" };
const drainageFields = [namedFeature, { property: "STRAHLER", label: "Ordem de Strahler" }, contributingArea];

function vector(id: string, name: string, kind: ProjectLayerConfig["kind"], panelOrder: number,
  source: Pick<GeoJsonSource, "popup" | "style" | "symbology">, defaultVisible = false): ProjectLayerConfig {
  return {
    id, name, kind, description: "", group: "vector", panelOrder, defaultVisible, opacityControl: true,
    source: { format: "geojson", url: `${r2}/geojson/vetores-micro/${id}.geojson`, autoZoom: false, ...source },
  };
}

function contour(id: string, name: string, panelOrder: number): ProjectLayerConfig {
  return vector(id, name, "contours", panelOrder, {
    style: { stroke: "#000000", strokeWidth: 1, clampToGround: true, zIndex: 5 },
    popup: { title: name, fields: [
      { property: "ELEVATION", label: "Elevação", suffix: " m" },
      { property: "cota_m", label: "Cota", suffix: " m" },
    ] },
  });
}

const sigefFields: VectorPopupConfig["fields"] = [
  namedFeature, { property: "parcela_co", label: "Código da parcela" },
  { property: "codigo_imo", label: "Código do imóvel" }, { property: "matricula", label: "Matrícula" },
  { property: "registro_m", label: "Matrícula no registro" }, { property: "municipio", label: "Município" },
];

function car(id: string, name: string, panelOrder: number, color: string): ProjectLayerConfig {
  return {
    id: `car-${id}`, name, kind: "vector", group: "vector",
    subsection: "Cadastro Ambiental Rural (CAR)", panelOrder,
    description: "Informação ambiental declarada ou disponibilizada no CAR.",
    defaultVisible: false, opacityControl: true,
    source: {
      format: "geojson", url: `${r2}/geojson/car/${id}.geojson`, autoZoom: false,
      style: {
        stroke: color, fill: color, strokeWidth: 1.5, fillOpacity: 0.3,
        clampToGround: true, zIndex: 4,
      },
      popup: {
        title: name,
        notice: "Fonte: CAR. Informação ambiental declarada ou disponibilizada no cadastro.",
        // O motor omite campos ausentes. Conferir o esquema quando o R2 estiver acessível.
        fields: [
          namedFeature,
          { property: "cod_imovel", label: "Código do imóvel no CAR" },
          { property: "tipo", label: "Tipo informado na fonte" },
          { property: "descricao", label: "Descrição da fonte" },
          { property: "area_ha", label: "Área", suffix: " ha" },
          { property: "municipio", label: "Município" },
        ],
      },
    },
  };
}

export const project: ProjectConfig = {
  ...templateProject,
  id: "antonio",
  name: "Antonio WebGIS",
  location: "Artur Nogueira, SP",
  initialCamera: {
    longitude: -47.1166681,
    latitude: -22.5820602,
    height: 3242.9,
    heading: 0.07,
    pitch: -64.83,
    roll: 0.01,
  },
  panel: { sectionTitles: { vector: "Vetores Micro" } },
  layers: [
    { ...templateProject.layers[0], exclusiveGroup: "mapa-base" },
    {
      ...templateProject.layers[0],
      id: "basemap-google",
      name: "Google Satellite com rótulos",
      description: "Google Maps 2D Satellite com rótulos via Cesium ion",
      defaultVisible: false,
      exclusiveGroup: "mapa-base",
      source: {
        format: "ion-world-imagery",
        assetId: 3830183,
        fallback: {
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
          maximumLevel: 19,
        },
      },
    },
    ...antonioMacroLayers,
    raster("mde", "Modelo Digital de Elevação", "dem"),
    raster("declividade-graus", "Mapa da Declividade (°)", "decli"),
    raster("orientacao-vertentes", "Mapa da Orientação das Vertentes", "aspect"),
    {
      ...raster("declividade-porcentagem", "Mapa da Declividade (%)", "decli_ibge"),
      legend: {
        type: "image", title: "Mapa da Declividade (%)",
        imageUrl: "/legends/tab_legend.png", imageAlt: "Legenda do Mapa da Declividade (%)",
      },
    },
    // Ordem de desenho: polígonos abaixo das linhas e do perímetro.
    car("app", "Área de Preservação Permanente (APP)", 8, "#8BC34A"),
    car("reserva_legal", "Reserva Legal", 9, "#237A3B"),
    car("vegetacao_nativa", "Vegetação Nativa", 10, "#4DAD65"),
    car("area_consolidada", "Área Consolidada", 11, "#E6B85C"),
    vector("area_barragem_planejada", "Área da Barragem Planejada", "vector", 7, {
      style: {
        stroke: "#268BC4", fill: "#268BC4", strokeWidth: 1.5, fillOpacity: 0.3,
        clampToGround: true, zIndex: 4,
      },
      popup: {
        title: "Área da Barragem Planejada",
        notice: "Área planejada.",
        fields: [
          namedFeature,
          { property: "tipo", label: "Tipo informado na fonte" },
          { property: "descricao", label: "Descrição da fonte" },
          { property: "area_ha", label: "Área", suffix: " ha" },
        ],
      },
    }),
    contour("curvas_2m", "Curvas de Nível — 2 m", 2),
    contour("curvas_3m", "Curvas de Nível — 3 m", 3),
    vector("rede_drenagem", "Rede de Drenagem", "drainage", 4, {
      style: { stroke: "#00E5FF", strokeWidth: 1, clampToGround: true, zIndex: 10,
        classification: { property: "STRAHLER", classes: {
          1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
          2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
          3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
          4: { stroke: "#1546D8", strokeWidth: 3.4, zIndex: 13 },
          5: { stroke: "#0B2A9E", strokeWidth: 4.4, zIndex: 14 },
        } },
      },
      popup: { title: "Rede de Drenagem", fields: drainageFields },
    }),
    vector("peri_sigef", "Perímetro do Imóvel — SIGEF", "property-boundary", 1, {
      style: { stroke: "#FFD400", strokeWidth: 2.5, fillOpacity: 0, clampToGround: true, zIndex: 25 },
      popup: { title: "Perímetro do Imóvel — SIGEF", fields: sigefFields },
    }, true),
  ],
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
