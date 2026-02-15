using Microsoft.AspNetCore.Mvc;
using BookCatalog.Business.Services;
using BookCatalog.Models.DTOs;

namespace BookCatalog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorsController : ControllerBase
    {
        private readonly IAuthorService _service;

        public AuthorsController(IAuthorService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuthorDto>>> Get()
        {
            var authors = await _service.GetAllAsync();
            return Ok(authors);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AuthorDto>> Get(int id)
        {
            var author = await _service.GetByIdAsync(id);
            if (author == null) return NotFound();
            return Ok(author);
        }

        [HttpPost]
        public async Task<IActionResult> Post(AuthorDto authorDto)
        {
            await _service.AddAsync(authorDto);
            return CreatedAtAction(nameof(Get), new { id = authorDto.Id }, authorDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, AuthorDto authorDto)
        {
            if (id != authorDto.Id) return BadRequest();
            await _service.UpdateAsync(authorDto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
