using BookCatalog.Business.Services;
using BookCatalog.Models.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace BookCatalog.API.Controllers
{
    namespace BookCatalog.API.Controllers
    {
        [Route("api/[controller]")]
        [ApiController]
        public class BooksController : ControllerBase
        {
            private readonly IBookService _service;

            public BooksController(IBookService service)
            {
                _service = service;
            }

            [HttpGet]
            public async Task<ActionResult<IEnumerable<BookDto>>> Get()
            {
                var books = await _service.GetAllAsync();
                return Ok(books);
            }

            [HttpGet("{id}")]
            public async Task<ActionResult<BookDto>> Get(int id)
            {
                var book = await _service.GetByIdAsync(id);
                if (book == null) return NotFound();
                return Ok(book);
            }

            [HttpPost]
            public async Task<IActionResult> Post(BookDto bookDto)
            {
                await _service.AddAsync(bookDto);
                return CreatedAtAction(nameof(Get), new { id = bookDto.Id }, bookDto);
            }

            [HttpPut("{id}")]
            public async Task<IActionResult> Put(int id, BookDto bookDto)
            {
                if (id != bookDto.Id) return BadRequest();
                await _service.UpdateAsync(bookDto);
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
}
