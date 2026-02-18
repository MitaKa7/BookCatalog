using BookCatalog.Data;
using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
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

        // GET all books with AuthorName and CategoryName
        [HttpGet]
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
                    AuthorName = b.Author.Name,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category.Name,
                    Price = b.Price
                })
                .ToListAsync();

            return Ok(books);
        }

        // POST a new book
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] BookDto bookDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var book = new Book
            {
                Title = bookDto.Title,
                AuthorId = bookDto.AuthorId,
                CategoryId = bookDto.CategoryId,
                Price = bookDto.Price
            };

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            // Fill names for frontend
            bookDto.Id = book.Id;
            var author = await _context.Authors.FindAsync(book.AuthorId);
            var category = await _context.Categories.FindAsync(book.CategoryId);
            bookDto.AuthorName = author?.Name;
            bookDto.CategoryName = category?.Name;

            return CreatedAtAction(nameof(Get), new { id = bookDto.Id }, bookDto);
        }

        // DELETE a book
        [HttpDelete("{id}")]
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

