<script setup lang="ts">
 import type { Ref } from 'vue';
 import { ref, onMounted, watch } from 'vue';
 import type {MechData} from '../data-types';
 import { loadDataDir, DataDir } from '../data-loader';
 import { CURRENT_VERSION } from '../consts';
 import { partition, deepCopy, decode, encode } from '../utils';
 import { useRoute } from 'vue-router';

 const route = useRoute();

 const exportValue = ref('');

 const backgroundColor = ref(null);
 const gridColor = ref(null);
 const towerColor = ref(null);
 const unitColor = ref(null);


 const dataDir = await loadDataDir(CURRENT_VERSION);
 const mechs = dataDir.allMechs();
 const sortMechs = (): {[k: string]: MechData} => {
     const tiers = {};
     Object.values(mechs).forEach((mech) => {
	 tiers[mech.cost] = (tiers[mech.cost] || []).concat(mech);
     });
     return tiers;
 };

 const tieredMechs = ref(sortMechs());

 const DEFAULT_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
 const DEFAULT_GRID_COLOR = 'rgba(0,0,0,0.5)';
 const DEFAULT_TOWER_COLOR = 'blue';
 const DEFAULT_UNIT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-text-accent');
 const TILE_SIZE = 10;

 export interface Props {
     width?: number
     height?: number
 };

 const props = withDefaults(defineProps<Props>(), {
     width: 720,
     height: 600,
 });

 const canvasRef = ref(null);
 const objects: Ref<IDrawable[]> = ref([]);
 const objectOnMouse: Ref<IDrawable> = ref(null);
 const tab = ref("Create");
 const setTab = (name: string) => {
     tab.value = name;

     if (["Delete", "Move", "Colors", "Export"].includes(name)) {
	 objectOnMouse.value = null;
     }
 };

 let ctx = null;
 type Context = CanvasRenderingContext2D;

 interface  IPoint {
     x: number;
     y: number;
 }

 watch([objects, objectOnMouse, towerColor, unitColor, backgroundColor, gridColor], () => {
     drawCanvas();
     updateExport();
 });


 const updateExport = () => {
     const data = encode(JSON.stringify({
	 "objects": objects.value,
     }));
     exportValue.value = `${location.protocol}//${location.host}${route.path}?data=${data}`;
 }

 const getCtx: (() => Context) = () => {
     if (ctx === null) {
	 const canvas = canvasRef.value as HTMLCanvasElement;
	 canvas.width = props.width;
	 canvas.height = props.height;
	 canvas.style.width = canvas.width.toString();
	 canvas.style.height = canvas.height.toString();
	 canvas.setAttribute("tabindex", "0");
	 canvas.focus();
	 if (!canvas) return null;
	 ctx = canvas.getContext('2d');
     }
     return ctx;
 };

 const clickHandlers = {
     "Create": (point: IPoint) => {
	 if (objectOnMouse.value !== null && canPlaceObjectAt(point, objectOnMouse.value)) {
	     objects.value.push(copyDrawable(objectOnMouse.value));
	 }
	 else {
	     const [hits, misses] = objectsAtPoint(point);
	     if (hits.length === 1 && hits[0].movable) {
		 objectOnMouse.value = hits[0];
		 objects.value = misses;
	     }
	 }
     },
     "Move": (point: IPoint) => {
	 if (objectOnMouse.value !== null && canPlaceObjectAt(point, objectOnMouse.value)) {
	     objects.value.push(objectOnMouse.value);
	     objectOnMouse.value = null;
	 }
	 else {
	     const [hits, misses] = objectsAtPoint(point);
	     if (hits.length === 1 && hits[0].movable) {
		 objectOnMouse.value = hits[0];
		 objects.value = misses;
	     }
	 }
     },
     "Delete": (point: IPoint) => {
	 const [hits, misses] = objectsAtPoint(point);
	 if (hits.length === 1 && hits[0].movable) {
	     objects.value = misses;
	 }
     }
 };

 const clearAll = () => {
     objects.value = objects.value.filter((obj) => !obj.movable);
 };

 const focusCanvas = () =>  {
     const canvas = canvasRef.value as HTMLCanvasElement;
     canvas.focus();
 };

 const setupCanvas = ()  => {
     const ctx = getCtx();
     ctx.clearRect(0, 0, props.width, props.height);
     ctx.translate(props.width / 2, props.height / 2);
     ctx.scale(1, -1);
     ctx.fillStyle = 'red';
 };

 const clear = () => {
     ctx.clearRect(-props.width / 2, -props.height / 2, props.width, props.height);
     ctx.save();
     ctx.fillStyle = backgroundColor.value;
     ctx.fillRect(-props.width / 2, -props.height / 2, props.width, props.height);
     ctx.restore();
 }

 const drawCanvas = () => {
     clear();
     drawCenterBoundary();
     drawGrid();
     drawObjects();
     drawObject({drawable: objectOnMouse.value});
 };


 const drawObjects = () => {
     for (const obj of objects.value) {
	 drawObject({drawable: obj});
     }
 }


 const drawCenterBoundary = () => {
     ctx.lineWidth = 4;
     ctx.beginPath();
     ctx.moveTo(-360, -10);
     ctx.lineTo(360, -10);
     ctx.moveTo(-360, 10);
     ctx.lineTo(360, 10);

     ctx.moveTo(-300, -300);
     ctx.lineTo(-300, 300);
     ctx.moveTo(300, -300);
     ctx.lineTo(300, 300);
     ctx.stroke();
 }


 const drawLine = (points: IPoint[]) => {
     ctx.lineWidth = 1;
     ctx.beginPath();
     ctx.moveTo(points[0].x, points[0].y);
     for (const point of points.slice(1)) {
	 ctx.lineTo(point.x, point.y);
     }
     ctx.stroke();
 }


 const drawGrid = () => {
     ctx.save();
     ctx.strokeStyle = gridColor.value;
     for (let x = -360; x <= 360; x += TILE_SIZE) {
	 drawLine([{x: x, y: -300}, {x: x, y: 300}]);
     }

     for (let y = -300; y <= 300; y += TILE_SIZE) {
	 drawLine([{x: -360, y: y}, {x: 360, y: y}]);
     }
     ctx.restore();
 }

 const coloredRect = (color: Ref<string>) => {
     return drawRect.bind(null, color);
 }

 const drawRect = (style: Ref<string>, x: number, y: number, width: number, height: number) => {
     const save = ctx.fillStyle;
     ctx.fillStyle = style.value;
     ctx.fillRect(x, y, width, height);
     ctx.fillStyle = save;
 }

 const drawTower = coloredRect(towerColor);


 const loadObjects = () => {
     const data = route.query.data;
     if (!data) return [
	 {
	     movable: false,
	     x: -140,
	     y: -170,
	     width: 2,
	     height: 2,
	     render: drawTower,
	 },
	 {
	     movable: false,
	     x: 140,
	     y: -170,
	     width: 2,
	     height: 2,
	     render: drawTower,
	 },
	 {
	     movable: false,
	     x: 140,
	     y: 170,
	     width: 2,
	     height: 2,
	     render: drawTower,
	 },
	 {
	     movable: false,
	     x: -140,
	     y: 170,
	     width: 2,
	     height: 2,
	     render: drawTower,
	 },
     ];
     const value = JSON.parse(decode(data));
     console.log(value.objects);
     return value
	 .objects
	 .map((obj) => {
	     obj.render = vectorGraphics[obj.name] || drawTower;
	     return obj;
	 });
 };


 onMounted(() => {
     backgroundColor.value = DEFAULT_BG_COLOR;
     gridColor.value = DEFAULT_GRID_COLOR;
     towerColor.value = DEFAULT_TOWER_COLOR;
     unitColor.value = DEFAULT_UNIT_COLOR;
     setupCanvas();
     objects.value = loadObjects();
     console.log(objects.value);
 });


 interface IDrawable {
     movable: boolean,
     x: number;
     y: number;
     width: number;
     height: number;
     render: (x: number, y: number, width: number, height: number) => void;
 };

 const copyDrawable = (obj: IDrawable): IDrawable  => {
     const copy = deepCopy(obj)
     copy.render = obj.render;
     return copy;
 }

 const drawObject = (params: {drawable?: IDrawable}) => {
     if (params.drawable === null) return;
     const width = params.drawable.width * TILE_SIZE;
     const height = params.drawable.height * TILE_SIZE;
     const xAnchor = params.drawable.x - width / 2;
     const yAnchor = params.drawable.y - height / 2;
     params.drawable.render(xAnchor, yAnchor, width, height);
 };

 const getTransformedPoint = (point: IPoint): IPoint => {
     const transform = ctx.getTransform();
     const transformedX = point.x - transform.e;
     const transformedY = point.y - transform.f;
     return { x: transformedX, y: -transformedY };
 };

 const mouseout = (event: MouseEvent) => {
     if (objectOnMouse.value === null) return;
     objectOnMouse.value.x = -999;
     objectOnMouse.value.y = -999;
     drawCanvas();
 }

 const mousemove = (event: MouseEvent) => {
     if (objectOnMouse.value === null) return;
     let point = getTransformedPoint({x: event.offsetX, y: event.offsetY});
     objectOnMouse.value.x = point.x;
     objectOnMouse.value.y = point.y;
     snapToGrid(objectOnMouse.value);
     drawCanvas();
 };

 const mouseclick = (event: MouseEvent) =>  {
     let point = getTransformedPoint({x: event.offsetX, y: event.offsetY});
     clickHandlers[tab.value](point);
     drawCanvas();
 };

 const canPlaceObjectAt = (point: IPoint, obj: IDrawable): boolean => {
     let offsetX = obj.width * TILE_SIZE / 2;
     let offsetY = obj.height * TILE_SIZE / 2;
     return objectsAtPoint({x: obj.x - offsetX, y: obj.y - offsetY})[0].length === 0 &&
	    objectsAtPoint({x: obj.x + offsetX, y: obj.y - offsetY})[0].length === 0 &&
	    objectsAtPoint({x: obj.x - offsetX, y: obj.y + offsetY})[0].length === 0 &&
	    objectsAtPoint({x: obj.x + offsetX, y: obj.y + offsetY})[0].length === 0;

 }

 const objectsAtPoint = (point: IPoint): IDrawable[][] => {
     const [hits, misses] = partition(objects.value, (obj: IDrawable) => {
	 return isIn(point, obj);
     });
     return [hits, misses];
 };

 const isIn = (point: IPoint, obj: IDrawable): boolean => {
     let offsetX = obj.width * TILE_SIZE / 2;
     let offsetY = obj.height * TILE_SIZE / 2;
     return (obj.x - offsetX < point.x && point.x < obj.x + offsetX) &&
	    (obj.y - offsetY < point.y && point.y < obj.y + offsetY);
 };

 const snapToGrid = (object: IDrawable) => {
     let offsetX = object.width * TILE_SIZE / 2;
     let offsetY = object.height * TILE_SIZE / 2;

     let anchorX = object.x - offsetX;
     let anchorY = object.y - offsetY;
     anchorX = Math.round(anchorX / TILE_SIZE) * TILE_SIZE;
     anchorY = Math.round(anchorY / TILE_SIZE) * TILE_SIZE;

     object.x = anchorX + offsetX;
     object.y = anchorY + offsetY;
 };


 const rotate = () => {
     if (objectOnMouse.value === null) return;
     [
	 objectOnMouse.value.width,
	 objectOnMouse.value.height,
     ] = [
	 objectOnMouse.value.height,
	 objectOnMouse.value.width,
     ];
     drawCanvas();
 };

 const placeMech = (mechName: string) => {
     if (objectOnMouse.value && objectOnMouse.value?.name === mechName) {
	 objectOnMouse.value = null;
	 return;
     }
     const mech = dataDir.mechForName(mechName);
     const obj = {
	 name: mechName,
	 movable: true,
	 x: -1000,
	 y: -1000,
	 width: mech.dimension.width,
	 height: mech.dimension.height,
	 render: vectorGraphics[mechName],

     };
     objectOnMouse.value = obj;
     focusCanvas();
 };


 const vectorGraphics = {
     "VULCAN": (x: number, y: number, width: number, height: number) => {
	 const HW = width / 2;
	 const QW = width / 4;
	 const QH = height / 4;
	 ctx.save();
	 ctx.lineWidth = 2;
	 ctx.strokeStyle = unitColor.value;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 const path = new Path2D(
	     `M ${x},${y+width} ` +

	     `s ${QW},0,${QW},${-QH}` +
	     `v ${-QH}` +
	     `h ${HW}` +
	     `m ${-HW},0` +

	     `v ${-QW}` +
	     `h ${HW}` +
	     `v ${QW}` +
	     `m ${-HW},0` +

	     `l ${HW/3},${-HW/3}` +
	     `h ${HW/3}` +
	     `l ${HW/3},${HW/3}` +
	     `v ${QH}` +
	     `s 0,${QH},${QW},${QH}` +

	     `v ${-height}` +
	     `h ${-width}` +
	     `v ${height}` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "MELTING POINT": (x: number, y: number, width: number, height: number) => {
	 const HW = width / 2;
	 const HH = height / 2;
	 const QW = width / 4;
	 const QH = height / 4;
	 ctx.save();
	 ctx.lineWidth = 2;
	 ctx.strokeStyle = unitColor.value;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 const path = new Path2D(
	     `M ${x},${y} ` +

	     `l ${QW/2},${QH} ${QW/2},${-QH} ` +
	     `h ${HW} ` +
	     `l ${QW/2},${QH} ${QW/2},${-QH} ` +

	     `m ${-QW-2},${QH/2} ` +
	     `h ${-HW+4} ` +

	     `M ${x+QW/2},${y+HH} ` +
	     `a ${QW*3/2},${QH},360,1,1,0,1 ` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "MARKSMAN": (x: number, y: number, width: number, height: number) => {
	 const FW = width / 3;
	 const FH = height / 3;
	 const HW = width / 2;
	 const HH = height / 2;
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.strokeStyle = unitColor.value;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 const path = new Path2D(
	     `M ${x},${y} ` +
	     `m ${HW},0 l 0,${FH} m 0,${FH} l 0,${FH}` +

	     `M ${x},${y} ` +
	     `m 0,${HH} l ${FW},0 m ${FW},0 l ${FW},0` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();

     },
     "ARCLIGHT": (x: number, y: number, width: number, height: number) => {
	 const QW = width / 4;
	 const QH = height / 4;
	 const FH = height / 8;
	 const HW = width / 2;
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.strokeStyle = unitColor.value;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 const path = new Path2D(
	     `M ${x},${y} ` +

	     `m 0,${3*FH} l ${QW},0 ` +
	     `a 2,1,0,1,1,${HW},0 l ${QW} 0` +
	     `l 0,${QW} l ${-QW},0` +
	     `a 2,1,0,1,1,${-HW},0 l ${-QW} 0 l 0 ${-QH}` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "CRAWLER": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 8, y: 3};
	 const steps = {x: 5.5, y: 5};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {

		 ctx.beginPath();
		 ctx.arc(x + dx * steps.x, y + dy * steps.y, 1, 0, 2 * Math.PI);
		 ctx.fill();
	     }
	 }
	 ctx.restore();
     },
     "FANG": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 6, y: 3};
	 const steps = {x: 7.14, y: 5};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {

		 ctx.beginPath();
		 ctx.arc(x + dx * steps.x, y + dy * steps.y, 2, 0, 2 * Math.PI);
		 ctx.fill();
	     }
	 }
	 ctx.restore();
     },
     "HACKER": (x: number, y: number, width: number, height: number) => {
	 const QW = width / 4;
	 const QH = height / 4;
	 const HH = height / 2;
	 const HW = width / 2;
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.strokeStyle = unitColor.value;

	 const path = new Path2D(
	     `M ${x},${y+height} ` +

	     `c ${HW} 0 0 ${-HH} ${HW} ${-HH}` +
	     `c ${HW} 0 0 ${HH} ${HW} ${HH}` +

	     `M ${x},${y+QH*3} ` +

	     `c ${HW} 0 0 ${-QH} ${HW} ${-QH}` +
	     `c ${HW} 0 0 ${QH} ${HW} ${QH}` +

	     `M ${x} ${y} ` +
	     `l ${QW} 0 l ${QW} ${HH-5} l ${QW} ${-HH+5} l ${QW} 0` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "MUSTANG": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 6, y: 2};
	 const steps = {x: 7.14, y: 6.6};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {
		 ctx.fillRect(x + dx * steps.x - 1, y + dy * steps.y - 2, 3, 4);
	     }
	 }
	 ctx.restore();
     },
     "PHOENIX": (x: number, y: number, width: number, height: number) => {
	 const Q = 5;
	 const limits = {x: 2, y: 1};
	 const steps = {x: 20, y: 0};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.strokeStyle = unitColor.value;
	 for (let dx = 0; dx < limits.x; dx++) {
	     for (let dy = 0; dy < limits.y; dy++) {
		 const path = new Path2D(
		     `M ${x+dx*steps.x},${y+dy*steps.y} ` +

		     `m ${Q} ${Q} l ${2*Q} ${Q} m 0 ${-Q} l ${-2*Q} ${Q}` +
		     `m 2 2 l 3 3 l 4 -3` +
		     ``
		 );
		 ctx.stroke(path);
	     }
	 }
	 ctx.restore();
     },
     "RHINO": (x: number, y: number, width: number, height: number) => {
	 const T = width / 3
	 const Q = width / 4;
	 const F = width / 5;
	 const H = width / 2;
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.strokeStyle = unitColor.value;

	 const path = new Path2D(
	     `M ${x},${y+height/2} ` +
	     `l ${T} 0 l ${T/2} ${H} l ${T/2} ${-H} l ${T} 0 `+
	     `m 0 ${-Q} l ${-width} 0 `+
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "WASP": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 6, y: 2};
	 const steps = {x: 7.14, y: 6.6};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {
		 ctx.beginPath();
		 ctx.arc(x + dx * steps.x, y + dy * steps.y, 2, 0, 2 * Math.PI);
		 ctx.fill();
	     }
	 }
	 ctx.restore();
     },
     "SLEDGEHAMMER": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 5, y: 1};
	 const steps = {x: 8.3, y: 10};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {
		 ctx.fillRect(x + dx * steps.x - 3, y + dy * steps.y - 3, 6, 6, 0, 0, 2*Math.PI);
	     }
	 }
	 ctx.restore();
     },
     "STEEL BALL": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 4, y: 1};
	 const steps = {x: 10, y: 10};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.fillStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {
		 ctx.beginPath();
		 ctx.ellipse(x + dx * steps.x, y + dy * steps.y, 4, 5, 0, 0, 2*Math.PI);
		 ctx.fill();
	     }
	 }
	 ctx.restore();
     },
     "STORMCALLER": (x: number, y: number, width: number, height: number) => {
	 const limits = {x: 4, y: 1};
	 const steps = {x: 10, y: 10};
	 if (width < height) {
	     [limits.x, limits.y] = [limits.y, limits.x];
	     [steps.x, steps.y] = [steps.y, steps.x];
	 }
	 ctx.save();
	 ctx.lineWidth = 1;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);
	 ctx.strokeStyle = unitColor.value;
	 for (let dx = 1; dx <= limits.x; dx++) {
	     for (let dy = 1; dy <= limits.y; dy++) {
		 ctx.strokeRect(x + dx * steps.x - 3, y + dy * steps.y - 3, 6, 6, 0, 0, 2*Math.PI);
	     }
	 }
	 ctx.restore();
     },
     "FORTRESS": (x: number, y: number, width: number, height: number) => {
	 const Q = width / 4;
	 ctx.save();
	 ctx.lineWidth = 2;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 ctx.fillStyle = unitColor.value;
	 ctx.fillRect(x, y, width, Q/2);
	 ctx.fillRect(x+5, y, width-10, Q);
	 ctx.fillRect(x+10, y, width-20, 3*Q);

	 ctx.fillRect(x, y+3*Q, width, Q/2);

	 ctx.fillRect(x, y+3*Q, Q, Q);
	 ctx.fillRect(x+3*Q/2, y+3*Q, Q, Q);
	 ctx.fillRect(x+3*Q, y+3*Q, Q, Q);


	 ctx.restore();
     },
     "OVERLORD": (x: number, y: number, width: number, height: number) => {
	 const Q = width / 4;
	 ctx.save();
	 ctx.lineWidth = 2;
	 ctx.strokeStyle = unitColor.value;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 const path = new Path2D(
	     `M ${x},${y+width} ` +
	     `m ${3*Q/2} ${-Q/2} l ${Q} 0 l ${Q} ${-3*Q} l ${-3*Q} 0 l ${Q} ${3*Q} ` +
	     `m 0 ${-2*Q} l ${Q} 0` +
	     ``
	 );
	 ctx.stroke(path);
	 ctx.restore();
     },
     "WAR FACTORY": (x: number, y: number, width: number, height: number) => {
	 const H = width / 2;
	 const Q = width / 4;
	 const E = width / 8;
	 ctx.save();
	 ctx.lineWidth = 2;
	 ctx.fillStyle = backgroundColor.value;
	 ctx.fillRect(x, y, width, height);

	 ctx.fillStyle = unitColor.value;

	 ctx.fillRect(x + E, y + E, 2*E, 2*E);
	 ctx.fillRect(x + E + H, y + E, 2*E, 2*E);
	 ctx.fillRect(x + E, y + E + H, 2*E, 2*E);
	 ctx.fillRect(x + E + H, y + E + H, 2*E, 2*E);

	 ctx.fillRect(x + Q , y + Q, H, H);

	 ctx.restore();
     },
 };
</script>

<template>
    <div class="map-container">
	<canvas
	    class="canvas"
	    ref="canvasRef"
	    @mousemove="mousemove"
	    @click="mouseclick"
	    @keydown.r="rotate"
	    @mouseleave="mouseout"
	></canvas>
	<div class="map-editor-container">

	    <div class="tab-container">
		<div class="tab-button clickable"
		     v-bind:class="{'selected': tab==='Create'}"
		     @click="setTab('Create')"
		>
		    Create
		</div>
		<div class="tab-button clickable"
		     v-bind:class="{'selected': tab==='Move'}"
		     @click="setTab('Move')"
		>
		    Move
		</div>
		<div class="tab-button clickable"
		     v-bind:class="{'selected': tab==='Delete'}"
		     @click="setTab('Delete')"
		>
		    Delete
		</div>
		<div class="tab-button clickable"
		     v-bind:class="{'selected': tab==='Colors'}"
		     @click="setTab('Colors')"
		>
		    Colors
		</div>
		<div class="tab-button clickable"
		     v-bind:class="{'selected': tab==='Export'}"
		     @click="setTab('Export')"
		>
		    Export
		</div>
	    </div>

	    <div class="control-container"
		 v-if="tab ==='Create'">
		<div
		    v-bind:key="tier"
		    v-for="tier in tieredMechs"
		    class="mech-tier"
		>
		    <div
			class="unit-button clickable"
			v-for="mech in tier"
			v-bind:key="mech.name"
			v-bind:class="{'selected': objectOnMouse?.name === mech.name}"
			@click="placeMech(mech.name)">{{mech.name}}</div>
		</div>
		<span>Press r to rotate held unit.</span>
	    </div>
	    <div class="control-container"
		 v-if="tab ==='Move'">
		<span>Click on deployed units to move them.</span>
		<span>Press r to rotate held unit.</span>
	    </div>
	    <div class="control-container"
		 v-if="tab ==='Delete'">
		<span>Click on a unit to delete it.</span>
		<div
		    class="unit-button clickable"
		    @click="clearAll"
		>
		    Clear All
		</div>
	    </div>
	    <div class="control-container"
		 v-if="tab ==='Colors'">
		<div class="color-container">
		    <div class="color-row">
			<span>
			    Background Color
			</span>
			<LvColorpicker v-model="backgroundColor" :value="backgroundColor" />
		    </div>
		    <div class="color-row">
			<span>
			    Grid Color
			</span>
			<LvColorpicker v-model="gridColor" :value="gridColor" />
		    </div>
		    <div class="color-row">
			<span>
			    Unit Color
			</span>
			<LvColorpicker v-model="unitColor" :value="unitColor" />
		    </div>
		    <div class="color-row">
			<span>
			    Tower Color
			</span>

			<LvColorpicker v-model="towerColor" :value="towerColor" />

		    </div>
		</div>
	    </div>
	    <div class="export-container"
		 v-if="tab ==='Export'">
		{{exportValue}}
	    </div>


	</div>
    </div>
</template>


<style scoped>

 .export-container{
     display: grid;
     grid-auto-rows: 1fr;
     overflow-wrap: anywhere;
     padding: 10px;
     background-color: var(--color-background-soft);
 }


 .color-container {
     display: grid;
     grid-auto-rows: auto;
     grid-row-gap: 1em;
 }

 .color-row {
     display: grid;
     grid-template-columns: 1fr 2fr;
     justify-content: right;
 }

 .mech-tier {
     display: grid;
     grid-template-columns: 1fr 1fr 1fr;
 }

 .map-container {
     display: grid;
     grid-template-columns: 1fr 1fr;
 }

 .canvas {
     user-select: none;
 }

 .canvas:focus {
     outline: none;
     user-select: none;
 }

 .map-editor-container {
     display: grid;
     grid-template-columns: min-content auto;
 }

 .tab-container {
     display: grid;
     grid-auto-rows: min-content;
     grid-row-gap: 0.5em;

     padding-left: 10px;
     margin-top: 2em;

 }

 .control-container {
     display: grid;
     grid-auto-rows: min-content;
     grid-row-gap: 2em;

     padding: 10px;
     background-color: var(--color-background-soft);
 }

 .unit-button {
     padding: 4px;
     border: 2px solid var(--color-border);
     border-radius: 20px;
     text-align: center;
     width: 10em;
     margin: 3px;
 }

 .unit-button:hover {
     border-color: var(--color-border-hover);
     color: var(--color-heading);
 }
 .unit-button.selected {
     color: var(--color-text-accent);
     border-color: var(--color-text-accent);
 }

 .tab-button {
     border: 1px solid var(--color-border);
     border-right: 0;
     padding: 10px 30px;
 }
 .tab-button:hover {
     border-color: var(--color-border-hover);
     color: var(--color-heading);
 }
 .tab-button.selected {
     color: var(--color-heading);
     border-color: var(--color-background-soft);
     border-right: 0;
     background-color: var(--color-background-soft);
 }
</style>
