// (function () {
//   'use strict'

//   // Fetch all the forms we want to apply custom Bootstrap validation styles to
//   var forms = document.querySelectorAll('.needs-validation')

//   // Loop over them and prevent submission
//   Array.prototype.slice.call(forms)
//     .forEach(function (form) {
//       form.addEventListener('submit', function (event) {
//         if (!form.checkValidity()) {
//           event.preventDefault()
//           event.stopPropagation()
//         }

//         form.classList.add('was-validated')
//       }, false)
//     })
// })()
 // Animate posts on scroll
  const posts = document.querySelectorAll(".post");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle("active", entry.isIntersecting);
    });
  }, { threshold: 0.6 });
  posts.forEach(p => observer.observe(p));

  // ❤️ Like/Unlike functionality
  document.querySelectorAll(".like-form").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const postId = form.dataset.id;
      const btn = form.querySelector(".like-btn");
      const icon = btn.querySelector("i");
      const count = form.querySelector(".like-count");

      if (!postId) return console.error("postId undefined");

      try {
        const res = await fetch(`/like/${postId}`, { method: "POST" });
        const data = await res.json();

        // ✅ Update like count
        count.textContent = data.likesCount;

        // ✅ Toggle like state visually
        if (data.liked) {
          btn.classList.add("liked");
          icon.classList.remove("fa-regular");
          icon.classList.add("fa-solid");
        } else {
          btn.classList.remove("liked");
          icon.classList.remove("fa-solid");
          icon.classList.add("fa-regular");
        }

      } catch (err) {
        console.error("Error liking:", err);
      }
    });
  });


  //heart animation 
