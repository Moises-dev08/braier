
const menuBtn=document.getElementById('menuBtn'), menuPanel=document.getElementById('menuPanel');
function setMenu(open){menuPanel.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',open?'true':'false')}
menuBtn.addEventListener('click',()=>setMenu(!menuPanel.classList.contains('open')));
document.getElementById('menuClose').addEventListener('click',()=>setMenu(false));
document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',()=>setMenu(false)));
document.querySelectorAll('[data-set-op]').forEach(x=>x.addEventListener('click',()=>{activeOp=x.dataset.setOp;document.querySelectorAll('[data-op]').forEach(b=>b.classList.toggle('active',b.dataset.op===activeOp));updateStatus();filterCards();setMenu(false);document.getElementById('destacadas').scrollIntoView({behavior:'smooth'});}));
document.addEventListener('click',e=>{if(menuPanel.classList.contains('open')&&!menuPanel.contains(e.target)&&!menuBtn.contains(e.target))setMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);closeModal()}});

let activeType='',activeOp='Ambas'; const typeSelect=document.getElementById('typeSelect');
function selectType(type,scroll=false){activeType=type;typeSelect.value=type;document.querySelectorAll('.cat').forEach(c=>{const on=c.dataset.type===type;c.classList.toggle('active',on);c.setAttribute('aria-pressed',on)});filterCards();if(scroll)document.getElementById('destacadas').scrollIntoView({behavior:'smooth'})}
document.querySelectorAll('.cat').forEach(c=>c.addEventListener('click',()=>selectType(c.dataset.type,true)));
typeSelect.addEventListener('change',()=>selectType(typeSelect.value,false));
function setActiveOp(op){activeOp=op;document.querySelectorAll('[data-op]').forEach(x=>x.classList.toggle('active',x.dataset.op===activeOp));filterCards();}
document.querySelectorAll('[data-op]').forEach(b=>b.addEventListener('click',()=>setActiveOp(b.dataset.op)));
function updateStatus(){}
function filterCards(){document.querySelectorAll('.card').forEach(card=>{const okType=!activeType||card.dataset.cardType===activeType;const okOp=activeOp==='Ambas'||!activeOp||card.dataset.cardOp.includes(activeOp);card.style.display=(okType&&okOp)?'':'none';});}
document.getElementById('searchBtn').addEventListener('click',()=>{filterCards();const target=activeType?[...document.querySelectorAll('.property-type-group')].find(group=>group.dataset.propertyType===activeType&&group.style.display!=='none'):null;(target||document.getElementById('destacadas')).scrollIntoView({behavior:'smooth'})});
setActiveOp('Ambas');
const viewAll=document.getElementById('viewAll');if(viewAll)viewAll.addEventListener('click',()=>{activeType='';activeOp='Ambas';filterCards();window.scrollTo({top:document.getElementById('destacadas').offsetTop-60,behavior:'smooth'})});
const modal=document.getElementById('tasacionModal');
const tasacionForm=document.getElementById('tasacionForm');
const sendTasacion=document.getElementById('sendTasacion');
const tasacionError=document.getElementById('tasacionError');
function resetTasacion(){tasacionForm.reset();sendTasacion.disabled=false;sendTasacion.textContent='Solicitar tasación';tasacionError.hidden=true;tasacionError.textContent=''}
function openModal(){modal.classList.add('open');setMenu(false);setTimeout(()=>modal.querySelector('input').focus(),100)}
function closeModal(){modal.classList.remove('open');resetTasacion()}
document.getElementById('openTasacion').addEventListener('click',openModal);
document.getElementById('closeTasacion').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
tasacionForm.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const data=new FormData(tasacionForm);
  const fullName=String(data.get('full_name')||'').trim();
  const phone=String(data.get('phone')||'').trim();
  const email=String(data.get('email')||'').trim();
  if(fullName.length<2||phone.length<6){tasacionError.hidden=false;tasacionError.textContent='Completá nombre y teléfono.';return}
  sendTasacion.disabled=true;
  sendTasacion.textContent='Enviando…';
  tasacionError.hidden=true;
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm');
    const {SUPABASE_URL,SUPABASE_KEY}=await import('./config.js');
    const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
    const {error}=await supabase.from('braier_appraisals').insert({full_name:fullName,phone,email,property_type:String(data.get('property_type')||'Casa'),location:String(data.get('location')||'').trim(),comment:String(data.get('comment')||'').trim()});
    if(error) throw error;
    sendTasacion.textContent='Enviado ✓';
  }catch(error){
    console.warn(error);
    sendTasacion.disabled=false;
    sendTasacion.textContent='Solicitar tasación';
    tasacionError.hidden=false;
    tasacionError.textContent='No se pudo enviar. Probá de nuevo.';
  }
});

function bindSliders(){document.querySelectorAll('.card-slider').forEach(slider=>{
  const track=slider.querySelector('.card-slides');
  const slides=[...slider.querySelectorAll('.card-slide')];
  const dots=[...slider.querySelectorAll('.card-dot')];
  let index=0;
  const render=()=>{track.style.transform=`translateX(-${index*100}%)`;dots.forEach((d,i)=>d.classList.toggle('active',i===index));slider.dataset.index=index};
  slider.querySelector('.card-prev').addEventListener('click',()=>{index=(index-1+slides.length)%slides.length;render()});
  slider.querySelector('.card-next').addEventListener('click',()=>{index=(index+1)%slides.length;render()});
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{index=i;render()}));
  let startX=null;
  slider.addEventListener('touchstart',e=>{startX=e.touches[0].clientX},{passive:true});
  slider.addEventListener('touchend',e=>{if(startX===null)return; const dx=e.changedTouches[0].clientX-startX; if(Math.abs(dx)>35){index=dx<0?(index+1)%slides.length:(index-1+slides.length)%slides.length; render()} startX=null;},{passive:true});
  render();
});}
bindSliders();


let propertyDetails={"casa-maipu-igarzabal":{"title":"Casa en alquiler · B° Maipú 1ª Sección","location":"Igarzábal 2062 · Córdoba","price":"$1.400.000","operation":"ALQUILER","contract":"Contrato de 24 meses · ajuste trimestral por IPC","phone":"+54 3515-948375","description":"Imponente propiedad ubicada a metros de Av. Sabattini, con conexión rápida hacia Circunvalación y excelentes accesos a Parque Sarmiento, Nueva Córdoba, General Paz, Hospital San Roque, Terminal y el centro de la ciudad. Cuenta con excelente calidad constructiva, muy buena distribución, amplios ambientes, calefacción por piso radiante mediante caldera y pisos de madera entablonada.","features":["3 dormitorios con placares","Dormitorio principal en suite y con terraza","4 baños en total","Cochera doble con portón automático","Living con hogar a leña y balcón","Patio, jardín y asador con mesada y bacha","Cocina equipada con anafe, horno, muebles y campana","Terraza con excelente vista hacia la ciudad","Habitación de servicio con baño","Baulera y habitación guardaherramientas"]},"depto-alta-cordoba-isabel":{"title":"Departamento en alquiler · Alta Córdoba","location":"Isabel la Católica 852 · Alta Córdoba","price":"$570.000","operation":"ALQUILER","contract":"Disponible fin de octubre · contrato y requisitos: consultar","phone":"+54 351 594 8375","description":"Moderno departamento de 1 dormitorio ubicado a 150 metros de la plaza de Alta Córdoba, en pleno centro comercial del barrio. Se encuentra en un segundo piso frente, con pisos de porcelanato, muy buena ventilación e iluminación natural y gran balcón pasante. Cuenta con gas natural, edificio cableado con fibra óptica y servicio de internet de máxima velocidad. EPEC solicita cambio de titularidad al inquilino.","features":["43 m² de superficie total","1 dormitorio con ropero","1 baño completo","2° piso frente","Gran balcón pasante","Estar comedor con cocina integrada","Gas natural","Expensas: $135.000","Fibra óptica en el edificio"]},"depto-centro-galeria-la-merced":{"title":"Departamento apto vivienda u oficina · Centro","location":"Galería La Merced · Peatonal 25 de Mayo / Rivadavia 150 · Córdoba","price":"$570.000","operation":"ALQUILER","contract":"Contrato de 24 meses · actualización trimestral por IPC","phone":"+54 351 594 8375","description":"Departamento ubicado en el piso 14 de la Galería La Merced, en pleno microcentro de Córdoba y a pocos metros de Plaza San Martín. Ofrece una espectacular vista panorámica de la ciudad, la Catedral y la plaza. Es apto para vivienda, oficina o consultorio profesional, con luminosidad, tranquilidad y amplios ventanales.","features":["38 m² de superficie total","1 dormitorio con placard","1 baño completo","Living comedor con cocina integrada","Amplios ventanales en ambos ambientes","Vista panorámica a la ciudad, Catedral y Plaza San Martín","Gas natural","Seguridad las 24 horas","3 ascensores","Cochera opcional en el edificio","Expensas: consultar"]},"local-cofico-rodriguez-pena":{"title":"Local comercial en alquiler · Cofico","location":"Rodríguez Peña entre Jerónimo Luis de Cabrera y Bedoya · Córdoba","price":"$400.000","operation":"ALQUILER","contract":"Consultar condiciones de reserva","phone":"+54 3515-948375","description":"Excelente oportunidad sobre Rodríguez Peña, entre Jerónimo Luis de Cabrera y Bedoya, a solo 20 metros de Bedoya. Ubicado en una zona de gran circulación, en el límite entre Cofico y Alta Córdoba, a metros de una escuela. Ideal para oficina, kiosco, comercio, showroom y otros rubros. No apto gastronómico.","features":["25 m² totales","Salón de 3,20 m de ancho × 6 m de fondo","1 baño","Vidriera de cristal templado con reja","Único de los dos locales disponible","A metros de una escuela","Ideal para oficina, kiosco, comercio o showroom","No apto gastronómico"]},"depto-valle-tamar-52m2":{"title":"Departamento en alquiler · Valle Escondido","location":"Complejo Tamar · Av. Soldado Ramón A. Cabrera · Valle Escondido · Córdoba","price":"$720.000","operation":"ALQUILER","contract":"Contrato por 24 meses · actualización trimestral por IPC","phone":"+54 351 594 8375","description":"Departamento moderno, amplio y luminoso, ubicado en primer piso con ascensor, sobre Av. Soldado Ramón A. Cabrera, a solo 250 metros de Hola Valle y Valle Mall. Cuenta con una distribución funcional y excelentes terminaciones.","features":["52 m² de superficie total","1 dormitorio amplio con placard","1 baño completo en suite","Living comedor con cocina semiintegrada","Cocina equipada con amoblamiento completo","Aire acondicionado split","Calefacción central por radiadores y caldera dual","Pisos de porcelanato","Terraza común con asador y vistas a las sierras","Ascensor y cámaras de seguridad","Estacionamiento descubierto de uso común","Expensas: $110.000 aprox."]},"duplex-loft-valle-tamar-38m2":{"title":"Dúplex en alquiler · Valle Escondido · Complejo Tamar","location":"Complejo Tamar · Valle Escondido · Córdoba","price":"$680.000","operation":"ALQUILER","contract":"Contrato por 24 meses · ajuste trimestral por IPC","phone":"+54 3515-948375","description":"Moderno mini-loft tipo dúplex de 1 dormitorio, ubicado en Complejo Tamar, a solo 250 metros de Valle Mall y Hola Valle, con excelentes accesos hacia Circunvalación y zona norte.","features":["38 m² totales","Distribuido en 2 plantas","Cocina comedor en planta baja","1 dormitorio en planta alta","1 baño","Placares y mobiliario de cocina","Aire acondicionado frío/calor","Caldera dual Peisa","Estacionamiento descubierto y ascensor","Terraza común con asador y vistas","Expensas: $105.000"]},"depto-valle-tamar-36m2":{"title":"Departamento en alquiler · Valle Escondido · Complejo Tamar","location":"Complejo Tamar · Valle Escondido · Córdoba","price":"$700.000","operation":"ALQUILER","contract":"Contrato por 24 meses · ajuste trimestral por IPC","phone":"+54 351 594 8375","description":"Departamento de 1 dormitorio ubicado en segundo piso del Complejo Tamar, sobre Av. Soldado Ramón A. Cabrera, a solo 250 metros de Hola Valle y junto al ingreso a Las Terrazas. Es luminoso, ventilado y se encuentra en excelente estado.","features":["36 m² totales","1 dormitorio con placard de pared a pared","Living comedor con cocina integrada","Cocina equipada con amoblamiento completo","Espacio para heladera y lavarropas","1 baño completo","Caldera dual Peisa y calefacción central","Ascensor y estacionamiento descubierto","Cámaras de vigilancia","Terraza común, asador, solárium y vista a las sierras","Expensas: $105.000 aprox."]},"duplex-tamar-300m2":{"title":"Dúplex en alquiler · 2 dormitorios · Complejo Tamar","location":"Av. Intercountry / Soldado Ramón A. Cabrera · Valle Escondido · Córdoba","price":"$1.600.000","operation":"ALQUILER","contract":"Contrato por 24 meses · ajuste trimestral por IPC","phone":"+54 3515-948375","description":"Excelente dúplex en Complejo Tamar, entre el ingreso a Las Terrazas y Hola Valle, a solo 250 metros de Valle Mall. Una propiedad amplia, con ambientes cómodos y un gran espacio exterior al frente, en una zona tranquila, segura y con excelentes accesos.","features":["Aproximadamente 300 m² totales","2 dormitorios amplios con placares de pared a pared","2 baños completos","Gran living comedor","Amplia cocina comedor con modernos amoblamientos","Gran patio al frente de aproximadamente 16 m de ancho","Espacio para 2 o 3 vehículos","Galería con asador","Cámaras de seguridad","Expensas bajas","Apto mascota","Disponible a partir de octubre"]},"terreno-jardin-ingles-ii":{"title":"Terreno en venta · Jardín Inglés II · Valle Escondido","location":"Jardín Inglés Este · Manzana 2 · Lote en esquina · Valle Escondido","price":"USD 168.000","operation":"VENTA","contract":"Modalidad de venta: cesión de boleto","phone":"+54 351 650-3080","description":"Terreno en esquina de aproximadamente 829 m², rodeado de naturaleza y con excelente conectividad. Se ubica entre Piana y Jardín Inglés I, pegado a la Reserva Natural del Parque San Martín. El fondo del lote da a Av. Parque, con rápido acceso desde la última rotonda de Av. Parque de Valle Escondido.","features":["Manzana 2 · lote en esquina","31 × 29 metros · 829 m² aprox.","Pegado a la Reserva Natural del Parque San Martín","Fondo con salida a Av. Parque","Calles e infraestructura terminadas","Servicios subterráneos y alumbrado público","Barrio con doble cerco perimetral y medidas de seguridad","Guardia de ingreso","Transporte público a pocos metros"]},"depto-cofico-av-avellaneda":{"title":"Departamento en venta · 1 dormitorio con cochera · Cofico","location":"Av. Avellaneda entre Bedoya y José Luis de Cabrera · Córdoba","price":"USD 48.000","operation":"VENTA","contract":"Venta de contado al precio publicado · cesión de boleto de compraventa","phone":"+54 351 594 8375","description":"Departamento a estrenar en Cofico, dentro de un moderno edificio de 7 pisos con ascensor automático y cocheras. Una oportunidad para inversión o vivienda en una zona residencial con excelente ubicación y conectividad.","features":["1 dormitorio con placard","Living comedor","Cocina","Balcón","1 baño completo","Cochera incluida","Edificio con ascensor","Expensas: $92.000 aprox.","Sin escritura · cesión de boleto"]},"depto-alvear-53-centro":{"title":"Departamento en venta · 1 dormitorio · Centro","location":"Alvear 53, entre 25 de Mayo y Rosario de Santa Fe · Córdoba","price":"USD 52.000","operation":"VENTA","contract":"Actualmente alquilado · contrato vigente de 24 meses con ajuste trimestral por IPC","phone":"+54 351 594 8375","description":"Departamento amplio y muy luminoso, ubicado en cuarto piso contrafrente, a la vuelta de Plaza San Martín. Ideal para inversores por su renta vigente.","features":["1 dormitorio amplio con placard","1 baño completo de generosas dimensiones con placard empotrado","Cocina separada con lavadero","Living comedor con aire acondicionado y calefactor","Amplio pasillo de ingreso","4° piso · orientación contrafrente","Edificio con 2 ascensores","Todos los servicios conectados","Renta aprox.: $490.000 mensuales","Expensas: $105.000, más impuestos y servicios"]},"duplex-solares-del-rio-rio-ceballos":{"title":"Dúplex en venta · 3 dormitorios · Río Ceballos","location":"Housing Solares del Río · Dr. Bregante y Costanera · Río Ceballos","price":"Consultar precio","operation":"VENTA","contract":"Escritura y planos aprobados","phone":"+54 351 650-3080","description":"Dúplex de 3 dormitorios dentro del exclusivo Housing Solares del Río, un complejo cerrado a metros del Hotel Howard Johnson y de Av. San Martín. Combina seguridad, naturaleza y confort en un barrio de solo 18 viviendas.","features":["3 dormitorios, uno en planta baja","2 baños completos, uno en suite","Living comedor con salamandra","Gran cocina comedor","Calefactores en ambas plantas","Quincho/cochera cerrada con asador","Jardín privado con asador y vista a la costanera y arroyo","Ladrillo visto, techos de madera con tejas","Cerco perimetral y portón automático","Expensas bajas","Gas envasado y disponibilidad de conexión a gas natural"]},"depto-bv-san-juan-guemes":{"title":"Departamento en venta · 2 dormitorios · Zona Güemes","location":"Bv. San Juan entre Artigas y Corro · Córdoba","price":"USD 78.000","operation":"VENTA","contract":"Escritura inmediata · actualmente alquilado","phone":"+54 351 650-3080","description":"Departamento de 65 m² en segundo piso, contrafrente con orientación lateral a la calle, a solo 500 metros de Patio Olmos, junto a Nueva Córdoba y al Pasaje Peatonal Santo Tomás. Fue totalmente reciclado a nuevo y ofrece tranquilidad, luminosidad y ventilación.","features":["65 m²","2 dormitorios con interiores de placard","Amplio living comedor","Cocina Caledonia con barra desayunadora y gran guardado","1 baño completo con mampara","Cortinas roller en todas las aberturas","Iluminación LED","Segundo piso","Totalmente reciclado a nuevo","Actualmente alquilado · renta: $915.000 mensuales"]},"casa-lomas-del-zupay-unquillo":{"title":"Casa de diseño en venta · Lomas del Zupay · Unquillo","location":"Lomas del Zupay · Unquillo · Sierras Chicas · Córdoba","price":"USD 98.000","operation":"VENTA","contract":"Escritura y planos aprobados · actualmente alquilada","phone":"+54 351 594 8375","description":"Propiedad de diseño vanguardista desarrollada en medios niveles, dentro de un predio cerrado de solo 4 viviendas. Se destaca por su luminosidad, su techo vidriado sobre la caja de escalera y sus amplios espacios exteriores con galería, deck, patio y pileta.","features":["96 m² cubiertos, sin contabilizar deck ni pileta","1.200 m² de terreno","2 dormitorios, principal en suite","2 baños completos","Baño en suite con hidromasaje","Estar comedor y cocina integrada","Galería de 8 × 4 m con asador","Deck exterior, pileta y patio","Salamandra y 2 equipos de aire acondicionado split","Cochera","Ubicación lateral al arroyo","Predio cerrado con portón automático"]},"casa-punta-canada-quintas-de-los-nores":{"title":"Casa moderna en venta · Housing Punta Cañada","location":"Quintas de los Nores · Zona Sur · Córdoba Capital","price":"Consultar precio","operation":"VENTA","contract":"Consultar condiciones de venta","phone":"+54 351 594 8375","description":"Casa de diseño contemporáneo dentro de Housing Punta Cañada, en el predio de Quintas de los Nores, próximo a Manantiales. Está desarrollada íntegramente en una planta, con ambientes amplios, excelente iluminación natural y una distribución funcional.","features":["350 m² de superficie total","Construcción moderna de aproximadamente 3 años","Distribuida en una sola planta","3 dormitorios, principal con vestidor","2 baños completos y toilette","Living comedor luminoso","Cocina semiintegrada totalmente equipada","Galería con asador y jardín privado","Cochera con pérgola","Aires acondicionados split frío/calor y cortinas roller","Guardia de ingreso 24 horas, portón automático y pileta común"]},"casa-maipu-igarzabal-venta":{"title":"Casa en venta · B° Maipú 1ª Sección","location":"Igarzábal 2062 · Córdoba","price":"Consultar precio","operation":"VENTA","contract":"Escritura · venta de contado","phone":"+54 351 594 8375","description":"Imponente propiedad ubicada a metros de Av. Sabattini, con conexión rápida hacia Circunvalación y excelentes accesos a Parque Sarmiento, Nueva Córdoba, General Paz, Hospital San Roque, Terminal y el centro de la ciudad. Cuenta con excelente calidad constructiva, muy buena distribución, amplios ambientes, calefacción por piso radiante mediante caldera y pisos de madera entablonada.","features":["3 dormitorios con placares","Dormitorio principal en suite y con terraza","4 baños en total","Cochera doble con portón automático","Living con hogar a leña y balcón","Patio, jardín y asador con mesada y bacha","Cocina equipada con anafe, horno, muebles y campana","Terraza con excelente vista hacia la ciudad","Habitación de servicio con baño","Baulera y habitación guardaherramientas"]}};
const propertyModal=document.getElementById('propertyModal');
const propertyModalContent=document.getElementById('propertyModalContent');
const listingTitle=document.querySelector('#destacadas h2');
const listingLede=document.querySelector('#destacadas .lede');
const emptyState=document.getElementById('emptyState');
function esc(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function updateListingHeading(){
  const type=activeType;
  const op=activeOp;
  if(!listingTitle||!listingLede)return;
  if(type){listingTitle.textContent='Propiedades '+type.toLowerCase();listingLede.textContent='Propiedades disponibles dentro de esta categoría.';}
  else if(op&&op!=='Ambas'){listingTitle.textContent='Propiedades en '+op.toLowerCase();listingLede.textContent='Oportunidades disponibles de Braier Propiedades.';}
  else{listingTitle.textContent='Propiedades destacadas';listingLede.textContent='Una selección de oportunidades de Braier Propiedades.';}
}
filterCards=function(){
  let visible=0;
  document.querySelectorAll('.card').forEach(card=>{
    const okType=!activeType||card.dataset.cardType===activeType;
    const okOp=activeOp==='Ambas'||!activeOp||card.dataset.cardOp.includes(activeOp);
    const show=okType&&okOp;
    card.style.display=show?'':'none';
    if(show)visible++;
  });
  document.querySelectorAll('.property-type-group').forEach(group=>{
    group.style.display=[...group.querySelectorAll('.card')].some(card=>card.style.display!=='none')?'':'none';
  });
  document.querySelectorAll('.operation-panel').forEach(panel=>{panel.hidden=![...panel.querySelectorAll('.card')].some(card=>card.style.display!=='none');});
  if(emptyState)emptyState.hidden=visible!==0;
  updateListingHeading();
};
const previousSetMenu=setMenu;
setMenu=function(open){previousSetMenu(open);menuBtn.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');document.body.classList.toggle('menu-open',open)};
function bindActions(){document.querySelectorAll('.card-action').forEach(button=>button.addEventListener('click',()=>openProperty(button.dataset.propertyId||button.closest('.card').dataset.propertyId,button.closest('.card'))));}
bindActions();
function openProperty(id,card){
  if(!card)return;
  const d=propertyDetails[id]||{title:card.querySelector('h3')?.textContent||'Propiedad',location:card.querySelector('.location')?.textContent||'',price:card.querySelector('.price')?.textContent||'Consultar',operation:'PROPIEDAD',contract:'',phone:'+54 3515-948375',description:'Consultanos para recibir más información sobre esta propiedad.',features:[...card.querySelectorAll('.meta span')].map(x=>x.textContent)};
  const images=[...card.querySelectorAll('.card-slide img, .card-media > img')].map(img=>img.getAttribute('src')).filter(Boolean);
  const wa=String(d.whatsapp||'543515948375').replace(/\D/g,'');
  const waText=encodeURIComponent('Hola Braier Propiedades, quisiera consultar por: '+(d.title||'una propiedad'));
  propertyModalContent.innerHTML='<div class="property-modal-grid"><div><div class="property-gallery-main"><img id="propertyMainImage" alt="" src="'+(images[0]||'')+'"></div><div class="property-thumbs">'+images.map((src,i)=>'<button class="property-thumb '+(i===0?'active':'')+'" type="button" data-image-index="'+i+'"><img alt="Foto '+(i+1)+'" src="'+src+'"></button>').join('')+'</div></div><div class="property-modal-copy"><span class="badge">'+esc(d.operation)+'</span><h2 id="propertyTitle">'+esc(d.title)+'</h2><p class="property-location">'+esc(d.location)+'</p><div class="property-price">'+esc(d.price)+'</div><p class="property-description">'+esc(d.description)+'</p><div class="property-features">'+(d.features||[]).map(f=>'<div class="property-feature">'+esc(f)+'</div>').join('')+'</div>'+(d.contract?'<div class="property-contract">'+esc(d.contract)+'</div>':'')+'<a class="property-contact" href="https://wa.me/'+wa+'?text='+waText+'" rel="noopener" target="_blank">Consultar por WhatsApp · '+esc(d.phone)+'</a></div></div>';
  propertyModal.classList.add('open');
  propertyModal.querySelectorAll('.property-thumb').forEach(thumb=>thumb.addEventListener('click',()=>{propertyModal.querySelector('#propertyMainImage').src=images[Number(thumb.dataset.imageIndex)];propertyModal.querySelectorAll('.property-thumb').forEach(x=>x.classList.toggle('active',x===thumb));}));
}
document.getElementById('closeProperty').addEventListener('click',()=>propertyModal.classList.remove('open'));
propertyModal.addEventListener('click',e=>{if(e.target===propertyModal)propertyModal.classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')propertyModal.classList.remove('open')});
filterCards();


const ownerLeadForm=document.getElementById('ownerLeadForm');
if(ownerLeadForm)ownerLeadForm.addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const data=new FormData(form);
  const message=['Hola Braier Propiedades, quiero publicar una propiedad.','Nombre: '+data.get('ownerName'),'WhatsApp: '+data.get('ownerPhone'),'Necesito: '+data.get('ownerOperation'),'Tipo de propiedad: '+data.get('ownerType'),'Mensaje: '+(data.get('ownerMessage')||'Sin mensaje adicional')].join('\n');
  window.open('https://wa.me/543515948375?text='+encodeURIComponent(message),'_blank','noopener');
  const submit=form.querySelector('button[type="submit"]');
  if(submit){const original=submit.innerHTML;submit.textContent='Consulta preparada ✓';setTimeout(()=>{submit.innerHTML=original},2200)}
});

const TYPE_ORDER=["Departamentos","Casas","Locales","Terrenos","Galpones","Predios"];
function cardHtml(property){
  const images=[...(property.braier_property_images||[])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const slides=images.map(img=>'<div class="card-slide"><img alt="'+esc(img.alt||property.card_title)+'" src="'+esc(img.url)+'"></div>').join("");
  const dots=images.map((_,i)=>'<button aria-label="Ir a foto '+(i+1)+'" class="card-dot'+(i===0?' active':'')+'" data-dot="'+i+'" type="button"></button>').join("");
  const badges=['<span class="badge">'+esc(String(property.operation||"").toUpperCase())+'</span>'].concat((property.badges||[]).map(b=>'<span class="badge badge-light">'+esc(b)+'</span>')).join("");
  const meta=(property.meta||[]).map(item=>'<span>'+esc(item)+'</span>').join("");
  const note=property.note?'<div class="card-note">'+esc(property.note)+'</div>':'';
  const media=images.length
    ? '<div class="card-slider'+(images.length===1?' single-photo':'')+'" data-index="0"><div class="card-slides">'+slides+'</div><button aria-label="Foto anterior" class="card-nav card-prev" type="button">‹</button><button aria-label="Siguiente foto" class="card-nav card-next" type="button">›</button><div class="card-dots">'+dots+'</div></div><div class="badges">'+badges+'</div><div class="counter">'+images.length+' '+(images.length===1?'foto':'fotos')+'</div>'
    : '<div class="badges">'+badges+'</div>';
  return '<article class="card" data-card-op="'+esc(property.operation)+'" data-card-type="'+esc(property.property_type)+'" data-property-id="'+esc(property.id)+'"><div class="card-media">'+media+'</div><div class="card-body"><div class="price">'+esc(property.price_label||'Consultar precio')+'</div><h3>'+esc(property.card_title)+'</h3><div class="location">'+esc(property.location||'')+'</div>'+note+'<div class="meta">'+meta+'</div><button class="card-action" data-property-id="'+esc(property.id)+'" type="button">Ver propiedad</button></div></article>';
}
function groupHtml(type, rows){
  const label=rows.length===1?'1 propiedad':rows.length+' propiedades';
  return '<section class="property-type-group" data-property-type="'+esc(type)+'"><div class="property-type-head"><div class="property-type-title"><span class="property-type-kicker">TIPO DE PROPIEDAD</span><h4>'+esc(type)+'</h4></div><span class="property-type-count">'+label+'</span></div><div class="operation-grid property-type-grid">'+rows.map(cardHtml).join("")+'</div></section>';
}
function panelHtml(title, rows){
  const groups=TYPE_ORDER.map(type=>groupHtml(type, rows.filter(row=>row.property_type===type))).filter(html=>html.includes('class="card"')).join("");
  if(!groups) return "";
  const label=rows.length===1?'1 propiedad':rows.length+' propiedades';
  return '<section class="operation-panel"><div class="operation-panel-head"><div class="operation-panel-title"><h3>'+esc(title)+'</h3></div><span class="operation-count">'+label+'</span></div>'+groups+'</section>';
}
async function loadRemoteCatalog(){
  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm");
    const {SUPABASE_URL,SUPABASE_KEY}=await import("./config.js");
    const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data,error}=await supabase.from("braier_properties").select("*, braier_property_images(url,alt,sort_order)").eq("published",true).order("sort_order");
    if(error||!Array.isArray(data)||!data.length) return;
    propertyDetails={};
    data.forEach(row=>{
      propertyDetails[row.id]={title:row.title,location:row.location,price:row.price_label,operation:String(row.operation||"").toUpperCase(),contract:row.contract,phone:row.phone,whatsapp:row.whatsapp,description:row.description,features:row.features||[]};
    });
    const sales=data.filter(row=>row.operation==="Venta"||row.operation==="Venta Alquiler");
    const rentals=data.filter(row=>row.operation==="Alquiler");
    const cards=document.getElementById("cards");
    if(!cards) return;
    cards.innerHTML=panelHtml("Propiedades en venta", sales)+panelHtml("Propiedades en alquiler", rentals);
    bindSliders();
    bindActions();
    filterCards();
  }catch(error){
    console.warn("No se pudo actualizar el catálogo", error);
  }
}
loadRemoteCatalog();
