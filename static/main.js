// Lógica para el Slideshow (cambio tenue de imágenes)
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Cambia la imagen cada 4 segundos
setInterval(nextSlide, 4000);
// Lista de videos para el visor interactivo
const listaVideos = [
    { titulo: "Entrenamiento Grupal", src: "entrenamientogrupal.mp4" },
    { titulo: "Clase Personalizada", src: "personalizada.mp4" },
    { titulo: "Técnica", src: "tecnica.mp4" },
    { titulo: "Técnica Femenino", src: "tecnicafemenino.mp4" }
];

// LÓGICA DEL CARRUSEL DE PRESENTACIÓN (FADE AUTOMÁTICO)
let currentHeroIndex = 0;
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
let heroInterval;

function mostrarHeroSlide(index) {
    if (heroSlides.length === 0) return;
    
    // Quitar clase activa
    heroSlides.forEach(slide => slide.classList.remove('active'));
    heroDots.forEach(dot => dot.classList.remove('active'));

    // Calcular índice circular
    currentHeroIndex = (index + heroSlides.length) % heroSlides.length;

    // Activar slide y dot correspondiente
    heroSlides[currentHeroIndex].classList.add('active');
    if (heroDots[currentHeroIndex]) {
        heroDots[currentHeroIndex].classList.add('active');
    }
}

function irASlideHero(index) {
    mostrarHeroSlide(index);
    reiniciarAutoSlide();
}

function siguienteHeroSlide() {
    mostrarHeroSlide(currentHeroIndex + 1);
}

function reiniciarAutoSlide() {
    clearInterval(heroInterval);
    heroInterval = setInterval(siguienteHeroSlide, 4500); // Cambia cada 4.5 segundos
}

// Iniciar cambio automático al cargar
document.addEventListener('DOMContentLoaded', () => {
    reiniciarAutoSlide();
});