using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

using BookCatalog.API.Controllers; 
using BookCatalog.Data;
using BookCatalog.Models.DTOs; 
using BookCatalog.Models.Entities;


namespace BookCatalog.Tests.Controllers
{
    public class BooksControllerTests
    {
        
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        // 2. Помощен метод за симулиране на логнат потребител с конкретна роля
        private void SetUserContext(ControllerBase controller, string role, string email = "test@user.com")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "TestUser"),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public async Task Get_ShouldReturnOk_WithListOfBooks()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            dbContext.Books.Add(new Book { Id = 1, Title = "Книга 1", Price = 10m, AuthorId = 1, CategoryId = 1 });
            dbContext.Books.Add(new Book { Id = 2, Title = "Книга 2", Price = 20m, AuthorId = 1, CategoryId = 1 });
            await dbContext.SaveChangesAsync();

            var controller = new BooksController(dbContext);

            // Act
            var result = await controller.Get();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var books = Assert.IsAssignableFrom<IEnumerable<BookDto>>(okResult.Value);
            Assert.Equal(2, books.Count());
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenIdDoesNotExist()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var controller = new BooksController(dbContext);

            // Act
            var result = await controller.GetById(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Post_ShouldCreateBook_WhenDataIsValid()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            // Добавяме автор и категория, защото контролерът ти проверява дали съществуват
            dbContext.Authors.Add(new Author { Id = 1, Name = "Автор 1" });
            dbContext.Categories.Add(new Category { Id = 1, Name = "Категория 1" });
            await dbContext.SaveChangesAsync();

            var controller = new BooksController(dbContext);
            SetUserContext(controller, "Editor");

            var newBookDto = new BookDto
            {
                Title = "Нова Книга",
                AuthorId = 1,
                CategoryId = 1,
                Price = 15.50m
            };

            // Act
            var result = await controller.Post(newBookDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var createdBook = Assert.IsType<BookDto>(createdResult.Value);
            Assert.Equal("Нова Книга", createdBook.Title);
            Assert.Equal(1, dbContext.Books.Count());
        }

        [Fact]
        public async Task Delete_ShouldRemoveBook_WhenUserIsAdmin()
        {
            // Arrange
            var dbContext = GetInMemoryDbContext();
            var book = new Book { Id = 1, Title = "Книга за триене", Price = 15m, AuthorId = 1, CategoryId = 1 };
            dbContext.Books.Add(book);
            await dbContext.SaveChangesAsync();

            var controller = new BooksController(dbContext);
            SetUserContext(controller, "Admin"); 

            // Act
            var result = await controller.Delete(1);

            // Assert
            Assert.IsType<NoContentResult>(result); 
            Assert.Empty(dbContext.Books); 
        }
    }
}