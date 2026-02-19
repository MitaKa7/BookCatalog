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
    public class AuthorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthorsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var authors = await _context.Authors
                .AsNoTracking()
                .Select(a => new AuthorDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Biography = a.Biography
                })
                .ToListAsync();

            return Ok(authors);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var author = await _context.Authors
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => new AuthorDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Biography = a.Biography
                })
                .FirstOrDefaultAsync();

            if (author == null) return NotFound();
            return Ok(author);
        }

        [HttpPost]
        [Authorize(Roles = "Editor,Admin")]
        public async Task<IActionResult> Post([FromBody] AuthorDto authorDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (authorDto == null) return BadRequest("Missing author payload.");
            if (string.IsNullOrWhiteSpace(authorDto.Name)) return BadRequest("Name is required.");

            var author = new Author
            {
                Name = authorDto.Name.Trim(),
                Biography = authorDto.Biography?.Trim()
            };

            _context.Authors.Add(author);
            await _context.SaveChangesAsync();

            var created = new AuthorDto
            {
                Id = author.Id,
                Name = author.Name,
                Biography = author.Biography
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Put(int id, [FromBody] AuthorDto authorDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (authorDto == null) return BadRequest("Missing author payload.");
            if (string.IsNullOrWhiteSpace(authorDto.Name)) return BadRequest("Name is required.");

            var author = await _context.Authors.FirstOrDefaultAsync(a => a.Id == id);
            if (author == null) return NotFound();

            author.Name = authorDto.Name.Trim();
            author.Biography = authorDto.Biography?.Trim();

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null) return NotFound();

            _context.Authors.Remove(author);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict("Cannot delete author because it is referenced by other records (e.g. books).");
            }

            return NoContent();
        }
    }
}
