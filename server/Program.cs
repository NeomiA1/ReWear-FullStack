using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using RewearApi.BackgroundServices;
using RewearApi.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


/* מאפשר העלאת קבצים עד 300MB */
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit =
        300L * 1024L * 1024L;
});


builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();


/* שירות יצירת JWT */
builder.Services.AddScoped<JwtTokenService>();


/* קריאת הגדרות JWT מתוך appsettings.json */
string jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is missing."
    );

string jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing."
    );

string jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience is missing."
    );


/* הגדרת Authentication באמצעות JWT */
builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidIssuer = jwtIssuer,

                ValidateAudience = true,

                ValidAudience = jwtAudience,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ValidateLifetime = true,

                ClockSkew = TimeSpan.FromMinutes(1)
            };
    });


builder.Services.AddAuthorization();


/* שירות שבודק בקשות תרומה שפג תוקפן */
builder.Services.AddHostedService<
    DonationRequestExpirationService
>();


/* חיבור ל־React */
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReact",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "https://re-wear-full-stack.vercel.app"
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    );
});


var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("AllowReact");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();