using BookCatalog.Data;
using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
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
        public async Task<IActionResult> Get()
        {
            var authors = await _context.Authors
                .Select(a => new AuthorDto { Id = a.Id, Name = a.Name, Biography = a.Biography })
                .ToListAsync();
            return Ok(authors);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AuthorDto authorDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var author = new Author
            {
                Name = authorDto.Name,
                Biography = authorDto.Biography
            };

            _context.Authors.Add(author);
            await _context.SaveChangesAsync();

            authorDto.Id = author.Id; // EF generates Id
            return CreatedAtAction(nameof(Get), new { id = authorDto.Id }, authorDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null) return NotFound();

            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

