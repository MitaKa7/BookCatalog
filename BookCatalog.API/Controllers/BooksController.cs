using BookCatalog.Data;
using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookCatalog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BooksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var books = await _context.Books
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    AuthorId = b.AuthorId,
                    AuthorName = b.Author != null ? b.Author.Name : null,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category != null ? b.Category.Name : null,
                    Price = b.Price
                })
                .ToListAsync();

            return Ok(books);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var b = await _context.Books
                .Include(x => x.Author)
                .Include(x => x.Category)
                .Where(x => x.Id == id)
                .Select(x => new BookDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    AuthorId = x.AuthorId,
                    AuthorName = x.Author != null ? x.Author.Name : null,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category != null ? x.Category.Name : null,
                    Price = x.Price
                })
                .FirstOrDefaultAsync();

            if (b == null) return NotFound();
            return Ok(b);
        }

        [HttpPost]
        [Authorize(Roles = "Editor,Admin")]
        public async Task<IActionResult> Post([FromBody] BookDto bookDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var authorExists = await _context.Authors.AnyAsync(a => a.Id == bookDto.AuthorId);
            if (!authorExists) return BadRequest("Invalid AuthorId.");

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == bookDto.CategoryId);
            if (!categoryExists) return BadRequest("Invalid CategoryId.");

            var book = new Book
            {
                Title = bookDto.Title,
                AuthorId = bookDto.AuthorId,
                CategoryId = bookDto.CategoryId,
                Price = bookDto.Price
            };

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            // връщаме DTO с имена
            var createdDto = await _context.Books
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Where(b => b.Id == book.Id)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    AuthorId = b.AuthorId,
                    AuthorName = b.Author != null ? b.Author.Name : null,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category != null ? b.Category.Name : null,
                    Price = b.Price
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetById), new { id = createdDto.Id }, createdDto);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Put(int id, [FromBody] BookDto bookDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound();

            var authorExists = await _context.Authors.AnyAsync(a => a.Id == bookDto.AuthorId);
            if (!authorExists) return BadRequest("Invalid AuthorId.");

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == bookDto.CategoryId);
            if (!categoryExists) return BadRequest("Invalid CategoryId.");

            book.Title = bookDto.Title;
            book.AuthorId = bookDto.AuthorId;
            book.CategoryId = bookDto.CategoryId;
            book.Price = bookDto.Price;

            await _context.SaveChangesAsync();

            var resultDto = await _context.Books
                .Include(b => b.Author)
                .Include(b => b.Category)
                .Where(b => b.Id == id)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    AuthorId = b.AuthorId,
                    AuthorName = b.Author != null ? b.Author.Name : null,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category != null ? b.Category.Name : null,
                    Price = b.Price
                })
                .FirstAsync();

            return Ok(resultDto);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound();

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
